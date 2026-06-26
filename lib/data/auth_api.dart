import '../core/network/api_client.dart';
import '../domain/user.dart';

/// Результат входа/регистрации: `{access_token, user}`.
class AuthResult {
  const AuthResult({required this.accessToken, required this.user});
  final String accessToken;
  final User user;
}

/// Эндпоинты Auth (план, Шаг 4):
///   POST /auth/register, POST /auth/login → {access_token, user}
///   GET  /auth/me
class AuthApi {
  AuthApi(this._client);
  final ApiClient _client;

  Future<AuthResult> register({
    required String email,
    required String name,
    required String password,
  }) async {
    final data = await _client.post(
      '/auth/register',
      body: {'email': email, 'name': name, 'password': password},
    );
    return _result(data as Map<String, dynamic>);
  }

  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final data = await _client.post(
      '/auth/login',
      body: {'email': email, 'password': password},
    );
    return _result(data as Map<String, dynamic>);
  }

  Future<User> me() async {
    final data = await _client.get('/auth/me');
    return User.fromJson((data as Map).cast<String, dynamic>());
  }

  AuthResult _result(Map<String, dynamic> j) => AuthResult(
    accessToken: j['access_token'] as String,
    user: User.fromJson((j['user'] as Map).cast<String, dynamic>()),
  );
}
