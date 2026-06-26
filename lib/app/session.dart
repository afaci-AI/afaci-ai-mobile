import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/auth/token_store.dart';
import '../data/auth_api.dart';
import '../domain/user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState(this.status, [this.user]);
  final AuthStatus status;
  final User? user;

  const AuthState.unknown() : this(AuthStatus.unknown, null);
}

/// Состояние сессии. Источник истины для гарда роутинга.
///
/// Refresh-токена нет: при 401 интерсептор уже стёр токен и зовёт
/// [onForcedLogout] — здесь только переводим статус в unauthenticated
/// (см. план, Шаг 3).
class SessionController extends StateNotifier<AuthState> {
  SessionController(this._authApi, this._tokenStore)
    : super(const AuthState.unknown());

  final AuthApi _authApi;
  final TokenStore _tokenStore;

  /// Старт приложения: есть токен → GET /me; иначе → на логин.
  Future<void> bootstrap() async {
    final token = await _tokenStore.read();
    if (token == null || token.isEmpty) {
      state = const AuthState(AuthStatus.unauthenticated);
      return;
    }
    try {
      final user = await _authApi.me();
      state = AuthState(AuthStatus.authenticated, user);
    } catch (_) {
      // 401 уже обработан интерсептором (токен стёрт); прочие ошибки —
      // считаем сессию недействительной.
      state = const AuthState(AuthStatus.unauthenticated);
    }
  }

  Future<void> login(String email, String password) async {
    final res = await _authApi.login(email: email, password: password);
    await _tokenStore.save(res.accessToken);
    state = AuthState(AuthStatus.authenticated, res.user);
  }

  Future<void> register(String email, String name, String password) async {
    final res = await _authApi.register(
      email: email,
      name: name,
      password: password,
    );
    await _tokenStore.save(res.accessToken);
    state = AuthState(AuthStatus.authenticated, res.user);
  }

  Future<void> logout() async {
    await _tokenStore.clear();
    state = const AuthState(AuthStatus.unauthenticated);
  }

  /// Вызывается интерсептором при 401 (токен уже стёрт).
  void onForcedLogout() {
    if (state.status != AuthStatus.unauthenticated) {
      state = const AuthState(AuthStatus.unauthenticated);
    }
  }
}
