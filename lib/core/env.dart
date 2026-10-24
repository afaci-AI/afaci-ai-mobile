/// Конфигурация окружения. Базовый URL задаётся через --dart-define.
///
/// По умолчанию — dev-стенд по HTTPS; его сертификат подписан локальным CA
/// Caddy (доверие настроено в android/.../network_security_config.xml).
/// На Android-эмуляторе localhost хоста — это 10.0.2.2, если бэкенд поднят
/// локально на порту 8000:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
class Env {
  /// Базовый адрес API без завершающего слэша.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.foodcraftsl.lab',
  );

  /// Префикс версии API.
  static const String apiPrefix = '/api/v1';

  static String get apiRoot => '$apiBaseUrl$apiPrefix';
}
