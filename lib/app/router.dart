import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../domain/compute_report.dart';
import '../domain/product.dart';
import '../features/auth/login_screen.dart';
import '../features/calculator/compute_result_screen.dart';
import '../features/database/database_detail_screen.dart';
import '../features/home/home_shell.dart';
import '../features/saved/saved_detail_screen.dart';
import 'providers.dart';
import 'session.dart';

/// Роутинг.
///
/// Модель доступа как на сайте: приложение открыто без входа (видна «База
/// данных»), а закрытые разделы прячет AuthGate на уровне экрана — поэтому
/// глобального форс-редиректа на /login здесь нет. Вход — это отдельный
/// pushed-экран, доступный из гарда и профиля.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier(0);
  ref.listen(sessionProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final status = ref.read(sessionProvider).status;
      final loc = state.matchedLocation;

      // Пока проверяем токен на старте — держим сплэш.
      if (status == AuthStatus.unknown) {
        return loc == '/splash' ? null : '/splash';
      }
      // Сессия определена: уводим со сплэша в приложение.
      if (loc == '/splash') return '/';
      // После успешного входа/регистрации закрываем экран логина.
      if (status == AuthStatus.authenticated && loc == '/login') return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const _SplashScreen()),
      GoRoute(
        path: '/login',
        builder: (_, state) => LoginScreen(
          initialRegister: state.uri.queryParameters['mode'] == 'register',
        ),
      ),
      GoRoute(
        path: '/',
        builder: (_, __) => const HomeShell(),
        routes: [
          GoRoute(
            path: 'product',
            name: 'product-detail',
            builder: (_, state) =>
                DatabaseDetailScreen(product: state.extra as Product),
          ),
          GoRoute(
            path: 'compute-result',
            name: 'compute-result',
            builder: (_, state) =>
                ComputeResultScreen(report: state.extra as ComputeReport),
          ),
          GoRoute(
            path: 'saved/:id',
            name: 'saved-detail',
            builder: (_, state) =>
                SavedDetailScreen(id: state.pathParameters['id']!),
          ),
        ],
      ),
    ],
  );
});

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}
