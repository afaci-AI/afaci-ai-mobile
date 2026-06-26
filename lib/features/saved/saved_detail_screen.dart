import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers.dart';
import '../../app/widgets.dart';
import '../../core/format.dart';
import '../../core/network/api_exception.dart';
import '../../domain/saved_recipe.dart';
import 'saved_providers.dart';

/// Карточка сохранённой рецептуры с составом и метриками (план, Шаг 7).
class SavedDetailScreen extends ConsumerWidget {
  const SavedDetailScreen({required this.id, super.key});
  final String id;

  Future<void> _rename(
    BuildContext context,
    WidgetRef ref,
    SavedRecipe recipe,
  ) async {
    final controller = TextEditingController(text: recipe.name);
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Переименовать'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Название'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
    if (name == null || name.isEmpty || name == recipe.name) return;
    try {
      await ref.read(savedApiProvider).updateRecipe(recipe.id, name: name);
      ref.invalidate(savedRecipeProvider(recipe.id));
      invalidateSaved(ref);
    } on ApiException catch (e) {
      if (context.mounted) showSnack(context, e.message, error: true);
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Удалить рецептуру?'),
        content: const Text('Действие нельзя отменить.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Удалить'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(savedApiProvider).deleteRecipe(id);
      invalidateSaved(ref);
      if (context.mounted) context.pop();
    } on ApiException catch (e) {
      if (context.mounted) showSnack(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(savedRecipeProvider(id));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Рецептура'),
        actions: [
          if (async.hasValue)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => _rename(context, ref, async.value!),
            ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => _delete(context, ref),
          ),
        ],
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          e is ApiException ? e.message : 'Не удалось загрузить',
          onRetry: () => ref.invalidate(savedRecipeProvider(id)),
        ),
        data: (r) {
          final m = r.metrics;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(r.name, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 16),
              if (r.isDraft)
                const Card(
                  child: ListTile(
                    leading: Icon(Icons.edit_note),
                    title: Text('Черновик'),
                    subtitle: Text('Метрики не рассчитаны'),
                  ),
                )
              else
                Card(
                  child: Column(
                    children: [
                      _row('Биологическая ценность (БЦ)', '${Fmt.n1(m.bc)} %'),
                      _row('КРАС', Fmt.n2(m.kras)),
                      _row('Коэффициент V', Fmt.n2(m.v)),
                      _row('Коэффициент G', Fmt.n2(m.g)),
                      _row('Энергия', '${Fmt.n1(m.energyKcal)} ккал'),
                      if (m.cMinName != null)
                        _row(
                          'Лимит. АК (${m.cMinName})',
                          '${Fmt.n1(m.cMinScore)} %',
                        ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              Text(
                'Состав (${r.items.length})',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Card(
                child: Column(
                  children: r.items
                      .map(
                        (it) => ListTile(
                          dense: true,
                          leading: const Icon(Icons.circle, size: 8),
                          title: Text(
                            'Продукт ${it.productId.substring(0, 8)}…',
                          ),
                          subtitle: it.pricePerKg != null
                              ? Text('${Fmt.n1(it.pricePerKg)} ₽/кг')
                              : null,
                          trailing: Text(Fmt.grams(it.amountG)),
                        ),
                      )
                      .toList(),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _row(String label, String value) =>
      ListTile(dense: true, title: Text(label), trailing: Text(value));
}
