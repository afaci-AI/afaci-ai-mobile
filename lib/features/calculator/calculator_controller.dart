import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../data/calculator_api.dart';
import '../../domain/product.dart';
import '../../domain/reference_protein.dart';
import '../../domain/saved_recipe.dart';

/// Эталонные белки — справочник для селектора (план, Шаг 6).
final referenceProteinsProvider = FutureProvider<List<ReferenceProtein>>((
  ref,
) async {
  return ref.watch(calculatorApiProvider).referenceProteins();
});

/// Строка собираемой рецептуры: продукт + масса в граммах.
class IngredientDraft {
  IngredientDraft({required this.product, required this.amountG});
  final Product product;
  double amountG;
}

class CalculatorState {
  CalculatorState({this.referenceProteinId, List<IngredientDraft>? items})
    : items = items ?? [];

  String? referenceProteinId;
  final List<IngredientDraft> items;

  double get sumG => items.fold(0, (s, it) => s + it.amountG);
  bool get canCompute =>
      referenceProteinId != null &&
      items.isNotEmpty &&
      items.every((it) => it.amountG > 0);

  CalculatorState copy() => CalculatorState(
    referenceProteinId: referenceProteinId,
    items: items
        .map((e) => IngredientDraft(product: e.product, amountG: e.amountG))
        .toList(),
  );
}

/// Контроллер сборки рецептуры. Доменной математики тут нет — расчёт на
/// сервере (план, Шаг 0). Контроллер только формирует запрос.
class CalculatorController extends StateNotifier<CalculatorState> {
  CalculatorController() : super(CalculatorState());

  void setReference(String id) {
    final next = state.copy()..referenceProteinId = id;
    state = next;
  }

  /// Добавить или изменить ингредиент (используется отдельным экраном-редактором).
  ///
  /// [replacingId] — id ингредиента, который редактируем: если в редакторе
  /// выбрали другой продукт, старый убираем. Если продукт уже есть в составе —
  /// обновляем его массу (без дублей).
  void putIngredient({
    String? replacingId,
    required Product product,
    required double amountG,
  }) {
    final next = state.copy();
    if (replacingId != null && replacingId != product.id) {
      next.items.removeWhere((it) => it.product.id == replacingId);
    }
    final idx = next.items.indexWhere((it) => it.product.id == product.id);
    if (idx >= 0) {
      next.items[idx].amountG = amountG;
    } else {
      next.items.add(IngredientDraft(product: product, amountG: amountG));
    }
    state = next;
  }

  void remove(String productId) {
    final next = state.copy()
      ..items.removeWhere((it) => it.product.id == productId);
    state = next;
  }

  void reset() => state = CalculatorState();

  /// Преобразовать в тело запроса `/compute`.
  List<CalcItem> toCalcItems() => state.items
      .map((it) => CalcItem(productId: it.product.id, amountG: it.amountG))
      .toList();

  /// Преобразовать в состав для сохранения (`/saved/recipes`).
  List<SavedRecipeItem> toSavedItems() => state.items
      .map(
        (it) => SavedRecipeItem(productId: it.product.id, amountG: it.amountG),
      )
      .toList();
}

final calculatorControllerProvider =
    StateNotifierProvider<CalculatorController, CalculatorState>(
      (ref) => CalculatorController(),
    );
