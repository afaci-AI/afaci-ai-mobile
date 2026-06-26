import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Хранилище JWT поверх flutter_secure_storage.
///
/// Refresh-токена в контракте нет (см. план, Шаг 3): по истечении срока
/// или при 401 токен просто стирается, пользователь уходит на /login.
class TokenStore {
  TokenStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _key = 'afaci_jwt';

  Future<String?> read() => _storage.read(key: _key);

  Future<void> save(String token) => _storage.write(key: _key, value: token);

  Future<void> clear() => _storage.delete(key: _key);
}
