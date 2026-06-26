import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/brand.dart';
import '../../app/providers.dart';
import '../../app/session.dart';

/// Гард доступа на уровне экрана.
///
/// Повторяет модель сайта: продукты (База данных) открыты всем, а калькулятор,
/// рецептуры, ранжирование и оптимизация — только после входа. Гостю
/// показываем приглашение войти/зарегистрироваться вместо контента.
class AuthGate extends ConsumerWidget {
  const AuthGate({
    required this.child,
    required this.title,
    required this.message,
    super.key,
  });

  final Widget child;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(sessionProvider).status;
    if (status == AuthStatus.authenticated) return child;

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const BrandMark(size: 56, showText: false),
              const SizedBox(height: 20),
              Text(
                'Требуется вход',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.push('/login'),
                child: const Text('Войти'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => context.push('/login?mode=register'),
                child: const Text('Зарегистрироваться'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
