import 'package:dio/dio.dart';

/// Унифицированная ошибка API с человекочитаемым сообщением.
///
/// Бэкенд AFACI отдаёт ошибки в поле `detail` (FastAPI HTTPException) на
/// русском языке — показываем его дословно (см. план, Шаги 3–4).
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => message;

  /// Преобразовать DioException в ApiException с осмысленным текстом.
  factory ApiException.fromDio(DioException e) {
    final status = e.response?.statusCode;
    final data = e.response?.data;

    // FastAPI: {"detail": "..."} либо {"detail": [{"msg": ...}]} (валидация 422).
    if (data is Map && data['detail'] != null) {
      final detail = data['detail'];
      if (detail is String) {
        return ApiException(detail, statusCode: status);
      }
      if (detail is List && detail.isNotEmpty) {
        final first = detail.first;
        if (first is Map && first['msg'] != null) {
          return ApiException(first['msg'].toString(), statusCode: status);
        }
      }
    }

    final message = switch (e.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout => 'Превышено время ожидания сервера.',
      DioExceptionType.connectionError =>
        'Не удалось подключиться к серверу. Проверьте соединение.',
      _ =>
        status != null
            ? 'Ошибка сервера ($status).'
            : 'Неизвестная ошибка сети.',
    };
    return ApiException(message, statusCode: status);
  }
}
