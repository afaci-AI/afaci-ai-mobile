import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import 'update_controller.dart';

/// Полноэкранная заглушка для обязательного обновления (forceUpdate или
/// нарушение minSupportedVersionCode). Блокирует доступ к приложению —
/// нет кнопки «Позже», при попытке закрыть — выход из приложения.
///
/// Оборачивает MaterialApp в лэндинге; рисует барьер поверх контента.
class UpdateForceGate extends ConsumerWidget {
  const UpdateForceGate({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appUpdateProvider);

    if (!state.isForced || !state.hasPrompt) {
      return child;
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          // Обязательное обновление — без выхода из инсталлятора не уйти.
          SystemNavigator.pop();
        }
      },
      child: Stack(
        children: [
          child,
          Positioned.fill(
            child: ColoredBox(
              color: Colors.white,
              child: _UpdateSheet(state: state),
            ),
          ),
        ],
      ),
    );
  }
}

/// Модальный диалог для опционального обновления (не обязательного).
/// Показывается через showDialog; имеет кнопку «Позже».
class OptionalUpdateDialog extends ConsumerWidget {
  const OptionalUpdateDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(appUpdateProvider);
    return _UpdateSheet(state: state);
  }
}

/// Внутренняя разметка диалога/барьера, реагирует на [UpdateState]:
/// обычное состояние, скачивание с прогрессом, ошибка с повтором.
class _UpdateSheet extends ConsumerWidget {
  const _UpdateSheet({required this.state});
  final UpdateState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final controller = ref.read(appUpdateProvider.notifier);
    final info = state.info;

    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                Icons.system_update_alt,
                size: 48,
                color: scheme.primary,
              ),
              const SizedBox(height: 12),
              Text(
                info == null
                    ? 'Обновление'
                    : 'Доступна новая версия ${info.version}',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Пожалуйста, обновите приложение для продолжения работы.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              ),
              if (info?.changelog != null &&
                  info!.changelog!.isNotEmpty) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: scheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    info.changelog!,
                    textAlign: TextAlign.start,
                    style: theme.textTheme.bodyMedium,
                  ),
                ),
              ],
              const SizedBox(height: 24),
              ..._buildActions(context, ref, controller, scheme),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildActions(
    BuildContext context,
    WidgetRef ref,
    AppUpdateController controller,
    ColorScheme scheme,
  ) {
    final theme = Theme.of(context);

    // Скачивание — прогресс + статус без кнопок (диалог не закрывается).
    if (state.status == UpdateStatus.downloading) {
      final percent = state.progress == null
          ? 0
          : (state.progress! * 100).clamp(0, 100).toInt();
      return [
        LinearProgressIndicator(value: state.progress),
        const SizedBox(height: 8),
        Text(
          'Загрузка… $percent%',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium,
        ),
        const SizedBox(height: 8),
      ];
    }

    // Установка.
    if (state.status == UpdateStatus.installing) {
      return const [
        Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: CircularProgressIndicator(),
          ),
        ),
        SizedBox(height: 8),
        Text('Запуск установки…', textAlign: TextAlign.center),
        SizedBox(height: 8),
      ];
    }

    // Ошибка — повторить / позже.
    if (state.status == UpdateStatus.error) {
      final error = state.errorMessage ?? 'Произошла ошибка.';
      return [
        Text(
          error,
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(color: scheme.error),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: controller.retry,
          icon: const Icon(Icons.refresh),
          label: const Text('Повторить'),
        ),
        if (!state.isForced) ...[
          const SizedBox(height: 8),
          TextButton(
            onPressed: controller.skipUpdate,
            child: const Text('Позже'),
          ),
        ],
      ];
    }

    // Обычное состояние (available) — «Обновить» + (опционально) «Позже».
    final primary = FilledButton.icon(
      onPressed: controller.startDownload,
      icon: const Icon(Icons.download),
      label: const Text('Обновить'),
    );

    if (state.isForced) {
      // Обязательное — нет кнопки отмены.
      return [primary];
    }

    return [
      primary,
      const SizedBox(height: 8),
      TextButton(
        onPressed: controller.skipUpdate,
        child: const Text('Напомнить позже'),
      ),
    ];
  }
}
