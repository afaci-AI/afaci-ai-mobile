import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_version_info.dart';
import 'download_service.dart';
import 'install_service.dart';
import 'update_api.dart';

enum UpdateStatus {
  idle, // проверка ещё не проводилась / нет обновления
  checking,
  available, // диалог доступен (обязательный или опциональный)
  downloading,
  installing,
  error, // ошибка скачивания/разрешения — показать повтор
}

class UpdateState {
  const UpdateState({
    this.status = UpdateStatus.idle,
    this.info,
    this.isForced = false,
    this.progress,
    this.errorMessage,
  });

  final UpdateStatus status;
  final AppVersionInfo? info;

  /// True, если обновление обязательное (forceUpdate или минимально
  /// поддерживаемая версия нарушена) — диалог нельзя закрыть.
  final bool isForced;

  final double? progress; // 0.0–1.0 при скачивании
  final String? errorMessage;

  /// Обновление доступно (есть что показать пользователю).
  bool get hasPrompt => status == UpdateStatus.available;

  UpdateState copyWith({
    UpdateStatus? status,
    AppVersionInfo? info,
    bool? isForced,
    double? progress,
    String? errorMessage,
    bool clearInfo = false,
    bool clearProgress = false,
    bool clearError = false,
  }) {
    return UpdateState(
      status: status ?? this.status,
      info: clearInfo ? null : (info ?? this.info),
      isForced: isForced ?? this.isForced,
      progress: clearProgress ? null : (progress ?? this.progress),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

/// Проверка и установка обновлений приложения (вне Google Play).
///
/// Эндпоинт /api/v1/app/version публичный; ошибки бэкенда (503/429/сеть)
/// молча игнорируются — приложение продолжает работать. Опциональное
/// обновление показывается не чаще раза в сутки (throttle в shared_preferences);
/// обязательное — блокирует использование приложения.
class AppUpdateController extends StateNotifier<UpdateState> {
  AppUpdateController({
    required UpdateApi updateApi,
    required DownloadService downloadService,
    required InstallService installService,
  }) : _updateApi = updateApi,
       _downloadService = downloadService,
       _installService = installService,
       super(const UpdateState());

  static const _lastPromptKey = 'update_last_prompted_at';
  static const _promptInterval = Duration(days: 1);

  final UpdateApi _updateApi;
  final DownloadService _downloadService;
  final InstallService _installService;

  int _deviceVersionCode = 0;
  String? _downloadedPath;

  /// Проверка наличия обновлений. Вызывается при старте приложения.
  Future<void> checkForUpdate() async {
    if (state.status == UpdateStatus.checking ||
        state.status == UpdateStatus.downloading) {
      return;
    }
    state = const UpdateState(status: UpdateStatus.checking);

    final info = await _updateApi.checkVersion();
    if (info == null) {
      // 503/429/сеть — данных нет, молча работаем дальше.
      state = const UpdateState();
      return;
    }

    final package = await PackageInfo.fromPlatform();
    _deviceVersionCode = package.buildNumber.isEmpty
        ? 0
        : int.tryParse(package.buildNumber) ?? 0;

    final hasUpdate = info.versionCode > _deviceVersionCode;
    final isForced = info.forceUpdate ||
        (info.minSupportedVersionCode != null &&
            _deviceVersionCode < info.minSupportedVersionCode!);

    if (!hasUpdate && !isForced) {
      state = const UpdateState();
      return;
    }

    if (!isForced && !await _shouldPrompt()) {
      // Опциональное — уже показывали недавно, пропускаем.
      state = const UpdateState();
      return;
    }

    state = UpdateState(
      status: UpdateStatus.available,
      info: info,
      isForced: isForced,
    );
  }

  /// Нажата кнопка «Обновить»: запрашиваем разрешение и скачиваем APK.
  Future<void> startDownload() async {
    final info = state.info;
    if (info == null) return;

    state = state.copyWith(status: UpdateStatus.downloading, progress: 0);

    try {
      final path = await _downloadService.downloadApk(
        info.downloadUri,
        onProgress: (p) {
          if (state.status == UpdateStatus.downloading) {
            state = state.copyWith(progress: p);
          }
        },
      );
      _downloadedPath = path;
    } on DownloadException catch (e) {
      state = UpdateState(
        status: UpdateStatus.error,
        info: info,
        isForced: state.isForced,
        errorMessage: e.message,
      );
      return;
    }

    await _performInstall(info);
  }

  /// Повторная попытка после ошибки скачивания/разрешения.
  Future<void> retry() async {
    if (state.status != UpdateStatus.error || state.info == null) return;
    await startDownload();
  }

  /// «Позже» для опционального обновления — запоминаем дату показа.
  Future<void> skipUpdate() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(
      _lastPromptKey,
      DateTime.now().millisecondsSinceEpoch,
    );
    state = const UpdateState();
  }

  Future<void> _performInstall(AppVersionInfo info) async {
    final path = _downloadedPath;
    if (path == null) {
      state = UpdateState(
        status: UpdateStatus.error,
        info: info,
        isForced: state.isForced,
        errorMessage: 'Не удалось сохранить файл обновления.',
      );
      return;
    }

    final wasForced = state.isForced;
    state = UpdateState(status: UpdateStatus.installing, info: info);

    // Запрос/проверка разрешения установки из неизвестных источников (8+).
    final granted = await _installService.canRequestInstallPackages();
    if (!granted) {
      await _installService.openInstallPermissionSettings();
      // После возврата с экрана настроек — повторная проверка.
      final regranted = await _installService.canRequestInstallPackages();
      if (!regranted) {
        state = UpdateState(
          status: UpdateStatus.error,
          info: info,
          isForced: wasForced,
          errorMessage:
              'Разрешите установку из неизвестных источников и повторите.',
        );
        return;
      }
    }

    try {
      await _installService.installApk(path);
    } catch (_) {
      state = UpdateState(
        status: UpdateStatus.error,
        info: info,
        isForced: wasForced,
        errorMessage: 'Не удалось запустить установку.',
      );
      return;
    }

    // Файл больше не нужен.
    await _installService.cleanup(path);
    _downloadedPath = null;

    // Установка передана системному инсталлятору; приложение сворачивается.
    state = const UpdateState();
  }

  /// Throttle опционального диалога: не чаще раза в сутки.
  Future<bool> _shouldPrompt() async {
    final prefs = await SharedPreferences.getInstance();
    final last = prefs.getInt(_lastPromptKey);
    if (last == null) return true;
    final elapsed = DateTime.now().difference(
      DateTime.fromMillisecondsSinceEpoch(last),
    );
    return elapsed >= _promptInterval;
  }
}
