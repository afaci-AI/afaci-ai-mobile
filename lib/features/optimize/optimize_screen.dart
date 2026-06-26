import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/widgets.dart';
import '../../app/providers.dart';
import '../../core/format.dart';
import '../../core/network/api_exception.dart';
import '../../domain/cost_optimization.dart';
import '../calculator/calculator_controller.dart'
    show referenceProteinsProvider;
import '../products/product_picker.dart';
import 'optimize_controller.dart';

/// Оптимизация стоимости рецептуры (план, Шаг 6 «v2»).
///
/// Пользователь задаёт продукты-кандидаты с ценой (сом/кг) и границами массы,
/// опционально — ограничения качества (БЦ ≥, КРАС ≤). Сервер (SLSQP) находит
/// дешевейший состав на 100 г. Неразрешимая задача → 422 с текстом причины.
class OptimizeView extends ConsumerStatefulWidget {
  const OptimizeView({super.key});
  @override
  ConsumerState<OptimizeView> createState() => _OptimizeViewState();
}

class _OptimizeViewState extends ConsumerState<OptimizeView> {
  CostOptimizationResult? _result;
  bool _running = false;

  Future<void> _addProduct() async {
    final product = await ProductPicker.show(context);
    if (product != null) {
      ref.read(optimizeControllerProvider.notifier).addProduct(product);
      setState(() => _result = null);
    }
  }

  Future<void> _optimize() async {
    final ctrl = ref.read(optimizeControllerProvider.notifier);
    final state = ref.read(optimizeControllerProvider);
    setState(() {
      _running = true;
      _result = null;
    });
    try {
      final res = await ref
          .read(calculatorApiProvider)
          .optimizeCost(
            referenceProteinId: state.referenceProteinId!,
            candidates: ctrl.toCandidates(),
            bcMin: state.bcMin,
            krasMax: state.krasMax,
          );
      setState(() => _result = res);
    } on ApiException catch (e) {
      // 422 — неразрешимая задача (например, ограничения недостижимы).
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _running = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(optimizeControllerProvider);
    final refsAsync = ref.watch(referenceProteinsProvider);
    final notifier = ref.read(optimizeControllerProvider.notifier);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
      children: [
        // ---- действия ----
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: _addProduct,
                icon: const Icon(Icons.add),
                label: const Text('Добавить кандидата'),
              ),
            ),
            if (state.candidates.isNotEmpty) ...[
              const SizedBox(width: 8),
              IconButton(
                tooltip: 'Очистить',
                icon: const Icon(Icons.delete_sweep_outlined),
                onPressed: () {
                  notifier.reset();
                  setState(() => _result = null);
                },
              ),
            ],
          ],
        ),
        const SizedBox(height: 16),
        // ---- эталонный белок ----
        refsAsync.when(
          loading: () => const LinearProgressIndicator(),
          error: (e, _) => ErrorView(
            e is ApiException ? e.message : 'Не удалось загрузить эталоны',
            onRetry: () => ref.invalidate(referenceProteinsProvider),
          ),
          data: (refs) {
            if (state.referenceProteinId == null && refs.isNotEmpty) {
              final def = refs.firstWhere(
                (r) => r.isDefault,
                orElse: () => refs.first,
              );
              WidgetsBinding.instance.addPostFrameCallback(
                (_) => notifier.setReference(def.id),
              );
            }
            return DropdownButtonFormField<String>(
              value: state.referenceProteinId,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Эталонный белок'),
              items: refs
                  .map(
                    (r) => DropdownMenuItem(value: r.id, child: Text(r.label)),
                  )
                  .toList(),
              onChanged: (v) {
                if (v != null) notifier.setReference(v);
              },
            );
          },
        ),
        const SizedBox(height: 16),

        // ---- кандидаты ----
        Text(
          'Кандидаты (цена в сом/кг)',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 4),
        Text(
          'Итоговый состав нормируется на 100 г. Нужно ≥ 2 кандидатов.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 8),
        if (state.candidates.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: EmptyView(
              'Добавьте продукты-кандидаты',
              icon: Icons.savings_outlined,
            ),
          )
        else ...[
          ...state.candidates.map(
            (c) => _CandidateCard(
              key: ValueKey(c.product.id),
              productId: c.product.id,
              title: c.product.name,
              subtitle: c.product.subtitle,
              pricePerKg: c.pricePerKg,
              minAmountG: c.minAmountG,
              maxAmountG: c.maxAmountG,
              onChanged: () => setState(() => _result = null),
            ),
          ),
          if (!state.boundsFeasible && state.candidates.length >= 2)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Границы массы не допускают сумму 100 г '
                '(Σmin ${Fmt.n1(state.sumMin)} г, Σmax ${Fmt.n1(state.sumMax)} г).',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
        ],
        const SizedBox(height: 16),

        // ---- ограничения качества (опционально) ----
        Text(
          'Ограничения качества (необязательно)',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _ConstraintField(
                label: 'БЦ ≥, %',
                initial: state.bcMin,
                onChanged: notifier.setBcMin,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ConstraintField(
                label: 'КРАС ≤',
                initial: state.krasMax,
                onChanged: notifier.setKrasMax,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        FilledButton.icon(
          onPressed: (state.canOptimize && !_running) ? _optimize : null,
          icon: _running
              ? const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.savings),
          label: const Text('Оптимизировать'),
        ),

        if (_result != null) ...[
          const Divider(height: 32),
          _ResultView(result: _result!),
        ],
      ],
    );
  }
}

class _CandidateCard extends ConsumerWidget {
  const _CandidateCard({
    required this.productId,
    required this.title,
    required this.subtitle,
    required this.pricePerKg,
    required this.minAmountG,
    required this.maxAmountG,
    required this.onChanged,
    super.key,
  });

  final String productId;
  final String title;
  final String subtitle;
  final double pricePerKg;
  final double minAmountG;
  final double maxAmountG;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(optimizeControllerProvider.notifier);
    double? parse(String v) => double.tryParse(v.replaceAll(',', '.'));

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      if (subtitle.isNotEmpty)
                        Text(
                          subtitle,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    notifier.remove(productId);
                    onChanged();
                  },
                ),
              ],
            ),
            Row(
              children: [
                Expanded(
                  child: _numField(
                    label: 'Цена/кг',
                    value: pricePerKg == 0 ? '' : _fmt(pricePerKg),
                    onChanged: (v) {
                      final p = parse(v);
                      if (p != null) notifier.update(productId, pricePerKg: p);
                      onChanged();
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _numField(
                    label: 'мин, г',
                    value: _fmt(minAmountG),
                    onChanged: (v) {
                      final p = parse(v);
                      if (p != null) notifier.update(productId, minAmountG: p);
                      onChanged();
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _numField(
                    label: 'макс, г',
                    value: _fmt(maxAmountG),
                    onChanged: (v) {
                      final p = parse(v);
                      if (p != null) notifier.update(productId, maxAmountG: p);
                      onChanged();
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  static String _fmt(double v) =>
      v % 1 == 0 ? v.toStringAsFixed(0) : v.toString();

  Widget _numField({
    required String label,
    required String value,
    required ValueChanged<String> onChanged,
  }) {
    return TextFormField(
      initialValue: value,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(labelText: label, isDense: true),
      onChanged: onChanged,
    );
  }
}

class _ConstraintField extends StatelessWidget {
  const _ConstraintField({
    required this.label,
    required this.initial,
    required this.onChanged,
  });

  final String label;
  final double? initial;
  final ValueChanged<double?> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      initialValue: initial?.toString() ?? '',
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(labelText: label),
      onChanged: (v) => onChanged(
        v.trim().isEmpty ? null : double.tryParse(v.replaceAll(',', '.')),
      ),
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({required this.result});
  final CostOptimizationResult result;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final q = result.report.quality;
    // имена продуктов берём из report.recipe (там разыменованные FK)
    final names = {for (final l in result.report.recipe) l.productId: l.name};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Оптимальный состав',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Card(
          color: scheme.primaryContainer,
          child: ListTile(
            leading: const Icon(Icons.savings),
            title: const Text('Стоимость 100 г'),
            trailing: Text(
              '${Fmt.n2(result.totalCostPer100g)} сом',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          child: Column(
            children: result.optimalItems
                .where((it) => it.amountG > 0.01)
                .map(
                  (it) => ListTile(
                    dense: true,
                    title: Text(
                      names[it.productId] ??
                          'Продукт ${it.productId.substring(0, 8)}…',
                    ),
                    subtitle: Text('${Fmt.n1(it.pricePerKg)} сом/кг'),
                    trailing: Text(Fmt.grams(it.amountG)),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 12,
          children: [
            Text('БЦ ${Fmt.n1(q.bc)}%'),
            Text('КРАС ${Fmt.n2(q.kras)}'),
            Text('V ${Fmt.n2(q.v)}'),
            Text('G ${Fmt.n2(q.g)}'),
          ],
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () =>
              context.pushNamed('compute-result', extra: result.report),
          icon: const Icon(Icons.assignment_outlined),
          label: const Text('Подробный отчёт'),
        ),
      ],
    );
  }
}
