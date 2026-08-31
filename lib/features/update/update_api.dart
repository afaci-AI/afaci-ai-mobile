import 'package:dio/dio.dart';

import '../../core/env.dart';
import 'app_version_info.dart';

/// Публичный (без токена) сервис проверки версии приложения.
///
/// Использует отдельный [Dio] без AuthInterceptor: эндпоинт не требует
/// авторизации и не должен инициировать принудительный логаут на 401/ошибке.
/// Ошибки (503 «версия не настроена», 429 rate limit, сеть) не бросаются
/// наружу — возвращается null, приложение молча продолжает работу.
class UpdateApi {
  UpdateApi()
    : _dio = Dio(
        BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Accept': 'application/json'},
        ),
      );

  final Dio _dio;

  /// GET /api/v1/app/version. null при недоступности данных/сети.
  Future<AppVersionInfo?> checkVersion() async {
    try {
      final res = await _dio.get('/api/v1/app/version');
      final data = res.data;
      if (data is! Map<String, dynamic>) return null;
      return AppVersionInfo.fromJson(data);
    } on DioException catch (_) {
      // 503 — версия не настроена; 429 — rate limit; сеть. Работаем как обычно.
      return null;
    }
  }
}
