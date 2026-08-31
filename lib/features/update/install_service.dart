import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:open_filex/open_filex.dart';

/// Менеджер установки APK через системный инсталлятор.
///
/// Android 8+ требует разрешение REQUEST_INSTALL_PACKAGES («разрешить
/// установку из этого источника») — проверить и открыть соответствующий
/// экран настроек через нативный канал. Сам запуск инсталлятора выполняет
/// пакет open_filex.
class InstallService {
  static const MethodChannel _channel = MethodChannel(
    'afaci/install_permission',
  );

  /// True, если установка из неизвестных источников для этого приложения
  /// уже разрешена (Android 8+). На старых Android и не-Android — true.
  Future<bool> canRequestInstallPackages() async {
    if (!kIsWeb && Platform.isAndroid) {
      return (await _channel.invokeMethod<bool>('canRequestPackageInstalls')) ??
          true;
    }
    return true;
  }

  /// Открывает системный экран «разрешить установку из этого источника».
  Future<void> openInstallPermissionSettings() async {
    if (!kIsWeb && Platform.isAndroid) {
      await _channel.invokeMethod<void>('openManageUnknownAppSources');
    }
  }

  /// Запускает системный инсталлятор для APK по [filePath].
  /// Открывает приложение и не падает при отсутствии зрителя.
  Future<void> installApk(String filePath) async {
    await OpenFilex.open(filePath, type: 'application/vnd.android.package-archive');
  }

  /// Удаляет скачанный APK после установки (необязательная очистка).
  Future<void> cleanup(String filePath) async {
    try {
      final f = File(filePath);
      if (await f.exists()) await f.delete();
    } catch (_) {}
  }
}
