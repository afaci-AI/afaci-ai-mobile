import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/calculator_api.dart';
import '../../domain/product.dart';

/// Кандидат-черновик: продукт + цена (сом/кг) + границы массы.
class CandidateDraft {
  CandidateDraft({
    required this.product,
    this.pricePerKg = 0,
    this.minAmountG = 0,
    this.maxAmountG = 100,
  });

  final Product product;
  double pricePerKg;
  double minAmountG;
  double maxAmountG;

  bool get isValid =>
      pricePerKg > 0 && minAmountG >= 0 && maxAmountG > minAmountG;
}

class OptimizeState {
  OptimizeState({
    this.referenceProteinId,
    List<CandidateDraft>? candidates,
    this.bcMin,
    this.krasMax,
  }) : candidates = candidates ?? [];

  String? referenceProteinId;
  final List<CandidateDraft> candidates;
  double? bcMin;
  double? krasMax;

  /// Границы должны допускать сумму = 100 г (иначе задача неразрешима).
  double get sumMin => candidates.fold(0, (s, c) => s + c.minAmountG);
  double get sumMax => candidates.fold(0, (s, c) => s + c.maxAmountG);
  bool get boundsFeasible =>
      candidates.length >= 2 && sumMin <= 100 && sumMax >= 100;

  bool get canOptimize =>
      referenceProteinId != null &&
      candidates.length >= 2 &&
      candidates.every((c) => c.isValid) &&
      boundsFeasible;

  OptimizeState copy() => OptimizeState(
    referenceProteinId: referenceProteinId,
    bcMin: bcMin,
    krasMax: krasMax,
    candidates: candidates
        .map(
          (c) => CandidateDraft(
            product: c.product,
            pricePerKg: c.pricePerKg,
            minAmountG: c.minAmountG,
            maxAmountG: c.maxAmountG,
          ),
        )
        .toList(),
  );
}

/// Контроллер сборки задачи оптимизации стоимости. Математики тут нет —
/// её делает сервер (SLSQP), контроллер лишь формирует запрос.
class OptimizeController extends StateNotifier<OptimizeState> {
  OptimizeController() : super(OptimizeState());

  void setReference(String id) => state = state.copy()..referenceProteinId = id;

  void addProduct(Product product) {
    if (state.candidates.any((c) => c.product.id == product.id)) return;
    state = state.copy()..candidates.add(CandidateDraft(product: product));
  }

  void update(
    String productId, {
    double? pricePerKg,
    double? minAmountG,
    double? maxAmountG,
  }) {
    final next = state.copy();
    for (final c in next.candidates) {
      if (c.product.id == productId) {
        if (pricePerKg != null) c.pricePerKg = pricePerKg;
        if (minAmountG != null) c.minAmountG = minAmountG;
        if (maxAmountG != null) c.maxAmountG = maxAmountG;
      }
    }
    state = next;
  }

  void remove(String productId) =>
      state = state.copy()
        ..candidates.removeWhere((c) => c.product.id == productId);

  void setBcMin(double? v) => state = state.copy()..bcMin = v;
  void setKrasMax(double? v) => state = state.copy()..krasMax = v;

  void reset() => state = OptimizeState();

  List<CostCandidate> toCandidates() => state.candidates
      .map(
        (c) => CostCandidate(
          productId: c.product.id,
          pricePerKg: c.pricePerKg,
          minAmountG: c.minAmountG,
          maxAmountG: c.maxAmountG,
        ),
      )
      .toList();
}

final optimizeControllerProvider =
    StateNotifierProvider<OptimizeController, OptimizeState>(
      (ref) => OptimizeController(),
    );
