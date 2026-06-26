import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../domain/compute_report.dart';

/// Отображение отчёта `/compute` (план, Шаг 6): нутриенты, аминокислотный
/// скор/КРАС, итоговые метрики (БЦ, V, G), предупреждения.
class ComputeResultScreen extends StatelessWidget {
  const ComputeResultScreen({required this.report, super.key});
  final ComputeReport report;

  @override
  Widget build(BuildContext context) {
    final m = report.macro;
    return Scaffold(
      appBar: AppBar(title: const Text('Результат расчёта')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ---- предупреждения ----
          if (report.warnings.isNotEmpty) _Warnings(report.warnings),

          // ---- итоговые метрики качества ----
          _SectionTitle('Качество белка'),
          Row(
            children: [
              _MetricCard(
                label: 'БЦ',
                value: Fmt.n1(report.quality.bc),
                unit: '%',
              ),
              const SizedBox(width: 8),
              _MetricCard(label: 'КРАС', value: Fmt.n2(report.quality.kras)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _MetricCard(label: 'V', value: Fmt.n2(report.quality.v)),
              const SizedBox(width: 8),
              _MetricCard(label: 'G', value: Fmt.n2(report.quality.g)),
            ],
          ),
          if (report.cMin != null) ...[
            const SizedBox(height: 8),
            Card(
              child: ListTile(
                leading: const Icon(Icons.trending_down),
                title: const Text('Лимитирующая аминокислота (C_min)'),
                subtitle: Text(report.cMin!.name),
                trailing: Text(
                  '${Fmt.n1(report.cMin!.score)} %',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ),
          ],
          if (report.limiting.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              children: report.limiting
                  .map(
                    (a) => Chip(
                      label: Text(a),
                      visualDensity: VisualDensity.compact,
                    ),
                  )
                  .toList(),
            ),
          ],

          // ---- макронутриенты ----
          _SectionTitle('Пищевая ценность (на ${Fmt.grams(report.sumG)})'),
          Card(
            child: Column(
              children: [
                _row('Белок', Fmt.grams(m.protein)),
                _row('Жир', Fmt.grams(m.fat)),
                _row('Углеводы', Fmt.grams(m.carb)),
                _row('Клетчатка', Fmt.grams(m.fiber)),
                _row('Белок : жир', Fmt.n2(m.proteinFatRatio)),
                _row('Энергия', '${Fmt.n1(report.energyKcal)} ккал'),
              ],
            ),
          ),

          // ---- аминокислотный скор ----
          if (report.aminoAcids.isNotEmpty) ...[
            _SectionTitle('Аминокислотный скор'),
            _AminoTable(report.aminoAcids),
          ],
        ],
      ),
    );
  }

  Widget _row(String label, String value) =>
      ListTile(dense: true, title: Text(label), trailing: Text(value));
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(0, 20, 0, 8),
    child: Text(text, style: Theme.of(context).textTheme.titleMedium),
  );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value, this.unit});
  final String label;
  final String value;
  final String? unit;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Text(label, style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 4),
              Text(
                unit != null ? '$value $unit' : value,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Warnings extends StatelessWidget {
  const _Warnings(this.warnings);
  final List<String> warnings;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      color: scheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: warnings
              .map(
                (w) => Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.warning_amber,
                      size: 18,
                      color: scheme.onErrorContainer,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        w,
                        style: TextStyle(color: scheme.onErrorContainer),
                      ),
                    ),
                  ],
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}

class _AminoTable extends StatelessWidget {
  const _AminoTable(this.acids);
  final List<AminoAcid> acids;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columnSpacing: 16,
          horizontalMargin: 12,
          columns: const [
            DataColumn(label: Text('АК')),
            DataColumn(label: Text('мг/г'), numeric: true),
            DataColumn(label: Text('Скор, %'), numeric: true),
          ],
          rows: acids.map((a) {
            final highlight = a.isLimiting || a.isMin;
            return DataRow(
              color: highlight
                  ? WidgetStatePropertyAll(
                      scheme.errorContainer.withValues(alpha: 0.4),
                    )
                  : null,
              cells: [
                DataCell(Text(a.name)),
                DataCell(Text(Fmt.n1(a.mJ))),
                DataCell(Text(Fmt.n1(a.score))),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}
