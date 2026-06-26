import 'package:dio/dio.dart';

import '../auth/token_store.dart';
import '../env.dart';
import 'api_exception.dart';
import 'auth_interceptor.dart';

/// Тонкая обёртка над Dio: единая база URL, интерсептор авторизации и
/// нормализация ошибок в [ApiException].
///
/// Доменная/бизнес-логика тут не живёт — только транспорт (зеркалит правило
/// CLAUDE.md: расчёты на сервере, клиент только ходит в API).
class ApiClient {
  ApiClient({
    required TokenStore tokenStore,
    required void Function() onUnauthorized,
  }) : _dio = Dio(
         BaseOptions(
           baseUrl: Env.apiRoot,
           connectTimeout: const Duration(seconds: 15),
           receiveTimeout: const Duration(seconds: 30),
           headers: {'Content-Type': 'application/json'},
         ),
       ) {
    _dio.interceptors.add(AuthInterceptor(tokenStore, onUnauthorized));
  }

  final Dio _dio;

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _request(() => _dio.get(path, queryParameters: query));

  Future<dynamic> post(String path, {Object? body}) =>
      _request(() => _dio.post(path, data: body));

  Future<dynamic> patch(String path, {Object? body}) =>
      _request(() => _dio.patch(path, data: body));

  Future<dynamic> delete(String path, {Object? body}) =>
      _request(() => _dio.delete(path, data: body));

  Future<dynamic> _request(Future<Response> Function() run) async {
    try {
      final res = await run();
      return res.data;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
