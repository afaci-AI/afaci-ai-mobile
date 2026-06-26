import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/auth/token_store.dart';
import '../core/network/api_client.dart';
import '../data/auth_api.dart';
import '../data/calculator_api.dart';
import '../data/products_api.dart';
import '../data/ranking_api.dart';
import '../data/saved_api.dart';
import 'session.dart';

/// Корневой DI-граф приложения (Шаг 1: DI в app/).

// Явные типы переменных-провайдеров обязательны: closure в apiClientProvider
// статически ссылается на sessionProvider (для форс-логаута на 401), а тот —
// обратно через authApiProvider. Аннотации разрывают цикл вывода типов;
// runtime-цикла нет — closure исполняется лениво, не при создании провайдера.
final Provider<TokenStore> tokenStoreProvider = Provider<TokenStore>(
  (ref) => TokenStore(),
);

final Provider<ApiClient> apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    tokenStore: ref.watch(tokenStoreProvider),
    onUnauthorized: () => ref.read(sessionProvider.notifier).onForcedLogout(),
  );
});

final Provider<AuthApi> authApiProvider = Provider<AuthApi>(
  (ref) => AuthApi(ref.watch(apiClientProvider)),
);
final Provider<ProductsApi> productsApiProvider = Provider<ProductsApi>(
  (ref) => ProductsApi(ref.watch(apiClientProvider)),
);
final Provider<CalculatorApi> calculatorApiProvider = Provider<CalculatorApi>(
  (ref) => CalculatorApi(ref.watch(apiClientProvider)),
);
final Provider<SavedApi> savedApiProvider = Provider<SavedApi>(
  (ref) => SavedApi(ref.watch(apiClientProvider)),
);
final Provider<RankingApi> rankingApiProvider = Provider<RankingApi>(
  (ref) => RankingApi(ref.watch(apiClientProvider)),
);

final StateNotifierProvider<SessionController, AuthState> sessionProvider =
    StateNotifierProvider<SessionController, AuthState>((ref) {
      return SessionController(
        ref.watch(authApiProvider),
        ref.watch(tokenStoreProvider),
      );
    });
