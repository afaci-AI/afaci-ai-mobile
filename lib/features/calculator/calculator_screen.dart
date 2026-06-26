import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers.dart';
import '../../app/widgets.dart';
import '../../core/format.dart';
import '../../core/network/api_exception.dart';
import '../saved/save_recipe_sheet.dart';
import 'calculator_controller.dart';
import 'ingredient_editor_screen.dart';

/// Экран сборки рецептуры и запуска расчёта (план, Шаг 6).
class CalculatorScreen extends ConsumerStatefulWidget {
  const CalculatorScreen({super.key});
  @override
  ConsumerState<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends ConsumerState<CalculatorScreen> {
  bool _computing = false;

  Future<void> _compute() async {
    final ctrl = ref.read(calculatorControllerProvider.notifier);
    final state = ref.read(calculatorControllerProvider);
    setState(() => _computing = true);
    try {
      final report = await ref
          .read(calculatorApiProvider)
          .compute(
            referenceProteinId: state.referenceProteinId!,
            items: ctrl.toCalcItems(),
          );
      if (mounted) {
        context.pushNamed('compute-result', extra: report);
      }
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _computing = false);
    }
  }

  /// Открыть отдельный экран добавления/редактирования ингредиента.
  Future<void> _openEditor({IngredientDraft? editing}) async {
    final result = await Navigator.of(context).push<IngredientEditResult>(
      MaterialPageRoute(
        builder: (_) => IngredientEditorScreen(
          initialProduct: editing?.product,
          initialAmountG: editing?.amountG,
        ),
      ),
    );
    if (result != null) {
      ref
          .read(calculatorControllerProvider.notifier)
          .putIngredient(
            replacingId: editing?.product.id,
            product: result.product,
            amountG: result.amountG,
          );
    }
  }

  Future<void> _save() async {
    final state = ref.read(calculatorControllerProvider);
    await SaveRecipeSheet.show(
      context,
      referenceProteinId: state.referenceProteinId,
      items: ref.read(calculatorControllerProvider.notifier).toSavedItems(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(calculatorControllerProvider);
    final refsAsync = ref.watch(referenceProteinsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Калькулятор'),
        actions: [
          if (state.items.isNotEmpty)
            IconButton(
              tooltip: 'Очистить',
              icon: const Icon(Icons.delete_sweep_outlined),
              onPressed: () =>
                  ref.read(calculatorControllerProvider.notifier).reset(),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEditor(),
        icon: const Icon(Icons.add),
        label: const Text('Продукт'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          // ---- эталонный белок ----
          refsAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => ErrorView(
              e is ApiException ? e.message : 'Не удалось загрузить эталоны',
              onRetry: () => ref.invalidate(referenceProteinsProvider),
            ),
            data: (refs) {
              // выбрать дефолтный эталон, если ещё не выбран
              if (state.referenceProteinId == null && refs.isNotEmpty) {
                final def = refs.firstWhere(
                  (r) => r.isDefault,
                  orElse: () => refs.first,
                );
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  ref
                      .read(calculatorControllerProvider.notifier)
                      .setReference(def.id);
                });
              }
              return DropdownButtonFormField<String>(
                value: state.referenceProteinId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Эталонный белок'),
                items: refs
                    .map(
                      (r) =>
                          DropdownMenuItem(value: r.id, child: Text(r.label)),
                    )
                    .toList(),
                onChanged: (v) {
                  if (v != null) {
                    ref
                        .read(calculatorControllerProvider.notifier)
                        .setReference(v);
                  }
                },
              );
            },
          ),
          const SizedBox(height: 16),
          // ---- ингредиенты ----
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Ингредиенты',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              Text(
                'Σ ${Fmt.grams(state.sumG)}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (state.items.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: EmptyView(
                'Добавьте продукты в рецептуру',
                icon: Icons.restaurant_menu,
              ),
            )
          else
            ...state.items.map(
              (it) => _IngredientTile(
                key: ValueKey(it.product.id),
                title: it.product.name,
                subtitle: it.product.subtitle,
                amountG: it.amountG,
                onTap: () => _openEditor(editing: it),
                onRemove: () => ref
                    .read(calculatorControllerProvider.notifier)
                    .remove(it.product.id),
              ),
            ),
          const SizedBox(height: 16),
          // ---- действия ----
          FilledButton.icon(
            onPressed: (state.canCompute && !_computing) ? _compute : null,
            icon: _computing
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.calculate_outlined),
            label: const Text('Рассчитать'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: state.items.isNotEmpty ? _save : null,
            icon: const Icon(Icons.bookmark_add_outlined),
            label: const Text('Сохранить рецептуру'),
          ),
        ],
      ),
    );
  }
}

/// Строка ингредиента (только просмотр). Тап открывает отдельный экран
/// редактирования; масса не правится прямо здесь.
class _IngredientTile extends StatelessWidget {
  const _IngredientTile({
    required this.title,
    required this.subtitle,
    required this.amountG,
    required this.onTap,
    required this.onRemove,
    super.key,
  });

  final String title;
  final String subtitle;
  final double amountG;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        title: Text(title),
        subtitle: subtitle.isEmpty ? null : Text(subtitle),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              Fmt.grams(amountG),
              style: Theme.of(context).textTheme.titleSmall,
            ),
            IconButton(
              tooltip: 'Удалить',
              icon: const Icon(Icons.close),
              onPressed: onRemove,
            ),
          ],
        ),
      ),
    );
  }
}
