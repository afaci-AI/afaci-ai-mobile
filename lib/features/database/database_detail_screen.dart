import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/widgets.dart';
import '../../app/providers.dart';
import '../../core/format.dart';
import '../../core/network/api_exception.dart';
import '../../domain/nutrient_row.dart';
import '../../domain/product.dart';

/// Карточка продукта из «Базы данных»: состав по нутриентам (публично).
class DatabaseDetailScreen extends ConsumerWidget {
  const DatabaseDetailScreen({required this.product, super.key});
  final Product product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final async = ref.watch(_nutrientsProvider(product));

    return Scaffold(
      appBar: AppBar(title: const Text('Продукт')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ---- шапка ----
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: scheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.inventory_2_outlined,
                  color: scheme.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  product.name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (product.category != null)
                _chip(context, Icons.folder_outlined, product.category!),
              if (product.subcategory != null)
                _chip(context, Icons.layers_outlined, product.subcategory!),
              if (product.region != null)
                _chip(context, Icons.place_outlined, product.region!),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'Нутриентный состав',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          async.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: LoadingView(),
            ),
            error: (e, _) => ErrorView(
              e is ApiException ? e.message : 'Не удалось загрузить нутриенты',
              onRetry: () => ref.invalidate(_nutrientsProvider(product)),
            ),
            data: (rows) {
              if (rows.isEmpty) {
                return const EmptyView(
                  'Нет данных о нутриентах',
                  icon: Icons.science_outlined,
                );
              }
              return _NutrientTable(rows: rows);
            },
          ),
        ],
      ),
    );
  }

  Widget _chip(BuildContext context, IconData icon, String label) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHigh,
        border: Border.all(color: scheme.outline),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: scheme.onSurfaceVariant),
          const SizedBox(width: 6),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

/// Нутриенты продукта (имя+регион уникальны в БД).
final _nutrientsProvider = FutureProvider.family<List<NutrientRow>, Product>((
  ref,
  product,
) async {
  return ref
      .watch(productsApiProvider)
      .productNutrients(productName: product.name, region: product.region);
});

class _NutrientTable extends StatelessWidget {
  const _NutrientTable({required this.rows});
  final List<NutrientRow> rows;

  @override
  Widget build(BuildContext context) {
    // группируем по типу нутриента
    final byType = <String, List<NutrientRow>>{};
    for (final r in rows) {
      byType.putIfAbsent(r.nutrientType ?? 'Прочее', () => []).add(r);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final entry in byType.entries) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 12, 4, 6),
            child: Text(
              entry.key,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
          Card(
            child: Column(
              children: [
                for (var i = 0; i < entry.value.length; i++) ...[
                  if (i > 0) const Divider(height: 1),
                  ListTile(
                    dense: true,
                    title: Text(entry.value[i].nutrientName),
                    trailing: Text(
                      '${Fmt.n2(entry.value[i].quantity)} ${entry.value[i].unit ?? ''}'
                          .trim(),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}
