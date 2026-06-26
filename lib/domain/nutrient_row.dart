// Строка нутриента из `GET /table/nutrients` (разыменованные FK).
// Колонки: product_name, region_name, nutrient_name, nutrient_type, unit,
// quantity, error_rate.

class NutrientRow {
  const NutrientRow({
    required this.productName,
    this.regionName,
    required this.nutrientName,
    this.nutrientType,
    this.unit,
    required this.quantity,
    this.errorRate,
  });

  final String productName;
  final String? regionName;
  final String nutrientName;
  final String? nutrientType;
  final String? unit;
  final double quantity;
  final double? errorRate;

  factory NutrientRow.fromJson(Map<String, dynamic> j) => NutrientRow(
    productName: j['product_name'] as String? ?? '',
    regionName: j['region_name'] as String?,
    nutrientName: j['nutrient_name'] as String? ?? '',
    nutrientType: j['nutrient_type'] as String?,
    unit: j['unit'] as String?,
    quantity: (j['quantity'] as num?)?.toDouble() ?? 0,
    errorRate: (j['error_rate'] as num?)?.toDouble(),
  );
}
