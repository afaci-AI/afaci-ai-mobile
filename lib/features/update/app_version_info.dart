import '../../core/env.dart';

/// Ответ эндпоинта GET /api/v1/app/version.
///
/// versionCode — целое число, строго возрастающее с каждым релизом: это
/// единственный надёжный критерий сравнения. version (строка) используется
/// только для показа пользователю.
class AppVersionInfo {
  const AppVersionInfo({
    required this.version,
    required this.versionCode,
    required this.apkUrl,
    this.changelog,
    this.forceUpdate = false,
    this.minSupportedVersionCode,
  });

  final String version;
  final int versionCode;
  final String apkUrl;
  final String? changelog;
  final bool forceUpdate;
  final int? minSupportedVersionCode;

  factory AppVersionInfo.fromJson(Map<String, dynamic> json) {
    return AppVersionInfo(
      version: json['version'] as String,
      versionCode: json['versionCode'] as int,
      apkUrl: json['apkUrl'] as String,
      changelog: json['changelog'] as String?,
      forceUpdate: json['forceUpdate'] as bool? ?? false,
      minSupportedVersionCode: json['minSupportedVersionCode'] as int?,
    );
  }

  /// Абсолютный URL APK. Бэкенд может отдавать относительный путь
  /// (/static/apk/...), тогда подставляем базовый адрес; если ссылка уже
  /// абсолютная (http://...) — используем как есть.
  Uri get downloadUri {
    if (apkUrl.startsWith('http')) {
      return Uri.parse(apkUrl);
    }
    return Uri.parse('${Env.apiBaseUrl}$apkUrl');
  }
}
