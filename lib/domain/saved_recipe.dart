// Сохранённая рецептура и её состав (`/saved/recipes`). Контракт — план, Шаг 7.

class SavedRecipeItem {
  const SavedRecipeItem({
    required this.productId,
    required this.amountG,
    this.sortOrder = 0,
    this.pricePerKg,
  });

  final String productId;
  final double amountG;
  final int sortOrder;
  final double? pricePerKg;

  factory SavedRecipeItem.fromJson(Map<String, dynamic> j) => SavedRecipeItem(
    productId: j['product_id'] as String,
    amountG: (j['amount_g'] as num).toDouble(),
    sortOrder: (j['sort_order'] as num?)?.toInt() ?? 0,
    pricePerKg: (j['price_per_kg'] as num?)?.toDouble(),
  );

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'amount_g': amountG,
    if (pricePerKg != null) 'price_per_kg': pricePerKg,
  };
}

/// Метрики рецептуры: {bc, kras, V, G, energy_kcal, c_min_name, c_min_score}.
class RecipeMetrics {
  const RecipeMetrics({
    this.bc,
    this.kras,
    this.v,
    this.g,
    this.energyKcal,
    this.cMinName,
    this.cMinScore,
  });

  final double? bc;
  final double? kras;
  final double? v;
  final double? g;
  final double? energyKcal;
  final String? cMinName;
  final double? cMinScore;

  /// Черновик без расчёта — все метрики null.
  bool get isEmpty => bc == null && kras == null && v == null && g == null;

  factory RecipeMetrics.fromJson(Map<String, dynamic> j) => RecipeMetrics(
    bc: (j['bc'] as num?)?.toDouble(),
    kras: (j['kras'] as num?)?.toDouble(),
    v: (j['V'] as num?)?.toDouble(),
    g: (j['G'] as num?)?.toDouble(),
    energyKcal: (j['energy_kcal'] as num?)?.toDouble(),
    cMinName: j['c_min_name'] as String?,
    cMinScore: (j['c_min_score'] as num?)?.toDouble(),
  );
}

class SavedRecipe {
  const SavedRecipe({
    required this.id,
    required this.name,
    this.groupId,
    required this.referenceProteinId,
    required this.metrics,
    this.items = const [],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? groupId;
  final String referenceProteinId;
  final RecipeMetrics metrics;
  final List<SavedRecipeItem> items;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get isDraft => metrics.isEmpty;

  factory SavedRecipe.fromJson(Map<String, dynamic> j) => SavedRecipe(
    id: j['id'] as String,
    name: j['name'] as String,
    groupId: j['group_id'] as String?,
    referenceProteinId: j['reference_protein_id'] as String,
    metrics: RecipeMetrics.fromJson(
      (j['metrics'] as Map?)?.cast<String, dynamic>() ?? const {},
    ),
    items: (j['items'] as List? ?? [])
        .map((e) => SavedRecipeItem.fromJson(e as Map<String, dynamic>))
        .toList(),
    createdAt: j['created_at'] is String
        ? DateTime.tryParse(j['created_at'] as String)
        : null,
    updatedAt: j['updated_at'] is String
        ? DateTime.tryParse(j['updated_at'] as String)
        : null,
  );
}
