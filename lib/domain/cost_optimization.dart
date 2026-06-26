import 'compute_report.dart';

// Результат оптимизации стоимости (`POST /calculator/optimize-cost`).
// Состав нормирован на 100 г; цены — сом/кг. Полный отчёт `report` имеет ту же
// структуру, что и `/compute` (переиспользуем [ComputeReport]).

class OptimalItem {
  const OptimalItem({
    required this.productId,
    required this.amountG,
    required this.pricePerKg,
  });

  final String productId;
  final double amountG;
  final double pricePerKg;

  factory OptimalItem.fromJson(Map<String, dynamic> j) => OptimalItem(
    productId: j['product_id'].toString(),
    amountG: (j['amount_g'] as num?)?.toDouble() ?? 0,
    pricePerKg: (j['price_per_kg'] as num?)?.toDouble() ?? 0,
  );
}

class CostOptimizationResult {
  const CostOptimizationResult({
    required this.optimalItems,
    required this.totalCostPer100g,
    required this.report,
  });

  final List<OptimalItem> optimalItems;
  final double totalCostPer100g;
  final ComputeReport report;

  factory CostOptimizationResult.fromJson(Map<String, dynamic> j) =>
      CostOptimizationResult(
        optimalItems: (j['optimal_items'] as List? ?? [])
            .map(
              (e) => OptimalItem.fromJson((e as Map).cast<String, dynamic>()),
            )
            .toList(),
        totalCostPer100g: (j['total_cost_per_100g'] as num?)?.toDouble() ?? 0,
        report: ComputeReport.fromJson(
          (j['report'] as Map?)?.cast<String, dynamic>() ?? const {},
        ),
      );
}
