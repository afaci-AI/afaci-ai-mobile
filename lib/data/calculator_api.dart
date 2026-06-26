import '../core/network/api_client.dart';
import '../domain/compute_report.dart';
import '../domain/cost_optimization.dart';
import '../domain/reference_protein.dart';

/// Один ингредиент запроса расчёта: `{product_id, amount_g}`.
class CalcItem {
  const CalcItem({required this.productId, required this.amountG});
  final String productId;
  final double amountG;

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'amount_g': amountG,
  };
}

/// Кандидат для оптимизации стоимости: продукт, цена (сом/кг) и границы
/// массы `[min_amount_g; max_amount_g]` (итог нормируется на 100 г).
class CostCandidate {
  const CostCandidate({
    required this.productId,
    required this.pricePerKg,
    this.minAmountG = 0.0,
    this.maxAmountG = 100.0,
  });

  final String productId;
  final double pricePerKg;
  final double minAmountG;
  final double maxAmountG;

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'price_per_kg': pricePerKg,
    'min_amount_g': minAmountG,
    'max_amount_g': maxAmountG,
  };
}

/// Калькулятор (план, Шаг 6).
///
/// Тело `/compute`: `{reference_protein_id, items: [{product_id, amount_g}]}`.
/// Требует JWT — авторизация подставляется интерсептором.
class CalculatorApi {
  CalculatorApi(this._client);
  final ApiClient _client;

  Future<List<ReferenceProtein>> referenceProteins() async {
    final data = await _client.get('/calculator/reference-proteins');
    return (data as List)
        .map(
          (e) => ReferenceProtein.fromJson((e as Map).cast<String, dynamic>()),
        )
        .toList();
  }

  Future<ComputeReport> compute({
    required String referenceProteinId,
    required List<CalcItem> items,
  }) async {
    final data = await _client.post(
      '/calculator/compute',
      body: {
        'reference_protein_id': referenceProteinId,
        'items': items.map((e) => e.toJson()).toList(),
      },
    );
    return ComputeReport.fromJson((data as Map).cast<String, dynamic>());
  }

  /// Оптимизация стоимости рецептуры (SLSQP на сервере, план Шаг 6 / v2).
  ///
  /// На неразрешимой задаче бэкенд отдаёт 422 с человекочитаемым `detail`
  /// — он всплывёт как [ApiException] из [ApiClient].
  Future<CostOptimizationResult> optimizeCost({
    required String referenceProteinId,
    required List<CostCandidate> candidates,
    double? bcMin,
    double? krasMax,
  }) async {
    final data = await _client.post(
      '/calculator/optimize-cost',
      body: {
        'reference_protein_id': referenceProteinId,
        'candidates': candidates.map((e) => e.toJson()).toList(),
        'constraints': {
          if (bcMin != null) 'bc_min': bcMin,
          if (krasMax != null) 'kras_max': krasMax,
        },
      },
    );
    return CostOptimizationResult.fromJson(
      (data as Map).cast<String, dynamic>(),
    );
  }
}
