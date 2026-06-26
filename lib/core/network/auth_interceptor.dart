import 'package:dio/dio.dart';

import '../auth/token_store.dart';

/// Интерсептор авторизации.
///
/// - подставляет `Authorization: Bearer <token>` на все запросы;
/// - на 401 (любой из трёх `detail` бэкенда — токена нет / битый / отключён)
///   стирает токен и дёргает [onUnauthorized], чтобы роутер увёл на /login.
///   Refresh-флоу не предусмотрен контрактом (см. план, Шаг 3).
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._tokenStore, this.onUnauthorized);

  final TokenStore _tokenStore;
  final void Function() onUnauthorized;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _tokenStore.read();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      await _tokenStore.clear();
      onUnauthorized();
    }
    handler.next(err);
  }
}
