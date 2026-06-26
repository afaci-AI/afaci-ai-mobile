/// Конфигурация окружения. Базовый URL задаётся через --dart-define.
///
/// На Android-эмуляторе localhost бэкенда — это 10.0.2.2 (см. план, Шаг 0).
/// Пример запуска:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
class Env {
  /// Базовый адрес API без завершающего слэша.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  /// Префикс версии API.
  static const String apiPrefix = '/api/v1';

  static String get apiRoot => '$apiBaseUrl$apiPrefix';
}
