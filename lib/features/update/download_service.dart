import 'dart:io';

import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';

/// Скачивание APK во временную директорию приложения (app-specific storage,
/// не требует WRITE_EXTERNAL_STORAGE на новых Android).
///
/// Отдельный [Dio] без AuthInterceptor — рут публичный, прогресс передаётся
/// через [onProgress].
class DownloadService {
  DownloadService()
      : _dio = Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 20),
            receiveTimeout: const Duration(minutes: 5),
          ),
        );

  final Dio _dio;

  /// Скачивает APK по [url] во временную папку и возвращает полный путь к
  /// файлу. Бросает [DownloadException] при ошибке — caller решает повторять.
  Future<String> downloadApk(
    Uri url, {
    void Function(double progress)? onProgress,
  }) async {
    final dir = await getTemporaryDirectory();
    final fileName = 'app-update-${DateTime.now().millisecondsSinceEpoch}.apk';
    final target = '${dir.path}${Platform.pathSeparator}$fileName';

    try {
      await _dio.download(
        url.toString(),
        target,
        deleteOnError: true,
        onReceiveProgress: (received, total) {
          if (total > 0 && onProgress != null) {
            onProgress(received / total);
          }
        },
      );
    } on DioException catch (e) {
      // Удаляем недокачанный файл, чтобы не засорять хранилище.
      try {
        final f = File(target);
        if (await f.exists()) await f.delete();
      } catch (_) {}
      throw DownloadException(_message(e));
    }
    return target;
  }

  String _message(DioException e) {
    return switch (e.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout => 'Превышено время ожидания скачивания.',
      DioExceptionType.connectionError =>
        'Не удалось подключиться, проверьте соединение.',
      _ =>
        e.response?.statusCode != null
            ? 'Ошибка скачивания (${e.response!.statusCode}).'
            : 'Неизвестная ошибка сети.',
    };
  }
}

/// Ошибка скачивания APK с человекочитаемым сообщением.
class DownloadException implements Exception {
  DownloadException(this.message);
  final String message;

  @override
  String toString() => message;
}
