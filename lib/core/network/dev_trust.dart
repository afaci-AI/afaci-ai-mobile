import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Доверие к корневому CA dev-стенда (`api.foodcraftsl.lab`).
///
/// `dart:io` проверяет TLS по встроенному в Dart набору корней и не использует
/// ни системное хранилище Android, ни `network_security_config.xml`. Поэтому
/// локальный CA Caddy подключаем явно — иначе handshake падает с
/// `badCertificate` (в UI это «Неизвестная ошибка сети»).
///
/// В release-сборке CA не подключается: там должен быть публичный сертификат.
class DevTrust {
  static const String _asset = 'assets/certs/caddy_root.pem';

  /// Включить dev-доверие. В release ничего не делает.
  static Future<void> install() async {
    if (kReleaseMode) return;
    final bytes = (await rootBundle.load(_asset)).buffer.asUint8List();
    final context = SecurityContext(withTrustedRoots: true)
      ..setTrustedCertificatesBytes(bytes);
    HttpOverrides.global = _DevHttpOverrides(context);
  }
}

class _DevHttpOverrides extends HttpOverrides {
  _DevHttpOverrides(this._context);

  final SecurityContext _context;

  @override
  HttpClient createHttpClient(SecurityContext? context) =>
      super.createHttpClient(_context);
}
