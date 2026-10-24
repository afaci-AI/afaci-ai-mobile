import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/providers.dart';
import 'app/router.dart';
import 'app/theme.dart';
import 'core/network/dev_trust.dart';
import 'features/update/update_dialog.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await DevTrust.install();
  runApp(const ProviderScope(child: AfaciApp()));
}

class AfaciApp extends ConsumerStatefulWidget {
  const AfaciApp({super.key});
  @override
  ConsumerState<AfaciApp> createState() => _AfaciAppState();
}

class _AfaciAppState extends ConsumerState<AfaciApp> {
  @override
  void initState() {
    super.initState();
    // Стартовая проверка сессии (есть токен → GET /me).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(sessionProvider.notifier).bootstrap();
      // Проверка обновлений выполняется параллельно с сессией (публичный
      // эндпоинт, не зависит от входа в аккаунт). Ошибки сети игнорируются.
      ref.read(appUpdateProvider.notifier).checkForUpdate();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    // Опциональное обновление (не обязательное) — показываем модальный диалог
    // при появлении доступного обновления. Обязательное блокирует через
    // UpdateForceGate поверх дерева.
    ref.listen(appUpdateProvider, (previous, next) {
      if (next.hasPrompt &&
          !next.isForced &&
          (previous == null || !previous.hasPrompt)) {
        // Показываем после кадра и через контекст навигатора go_router:
        // контекст самого AfaciApp находится выше MaterialApp и не видит
        // MaterialLocalizations.
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final dialogContext =
              router.routerDelegate.navigatorKey.currentContext;
          if (!mounted || dialogContext == null) return;
          showDialog<void>(
            context: dialogContext,
            barrierDismissible: false,
            builder: (_) => const OptionalUpdateDialog(),
          );
        });
      }
    });

    return UpdateForceGate(
      child: MaterialApp.router(
        title: 'AFACI',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        routerConfig: router,
        // Русская локализация (план, Шаг 10).
        locale: const Locale('ru'),
        supportedLocales: const [Locale('ru'), Locale('en')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
      ),
    );
  }
}
