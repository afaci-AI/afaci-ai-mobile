import 'package:flutter/material.dart';

import '../../domain/product.dart';
import '../products/product_browser.dart';

/// Результат добавления/редактирования ингредиента.
class IngredientEditResult {
  const IngredientEditResult({required this.product, required this.amountG});
  final Product product;
  final double amountG;
}

/// Отдельный экран добавления/редактирования ингредиента калькулятора.
///
/// Содержит полноценный выбор продукта ([ProductBrowser]: поиск, фильтры,
/// пагинация по 10) и ввод массы. Возвращает [IngredientEditResult] через
/// `Navigator.pop`, либо null если отменили.
class IngredientEditorScreen extends StatefulWidget {
  const IngredientEditorScreen({
    this.initialProduct,
    this.initialAmountG,
    super.key,
  });

  final Product? initialProduct;
  final double? initialAmountG;

  bool get isEdit => initialProduct != null;

  @override
  State<IngredientEditorScreen> createState() => _IngredientEditorScreenState();
}

class _IngredientEditorScreenState extends State<IngredientEditorScreen> {
  late Product? _selected = widget.initialProduct;
  late final TextEditingController _amount = TextEditingController(
    text: _fmt(widget.initialAmountG ?? 100),
  );

  static String _fmt(double v) => v % 1 == 0 ? v.toStringAsFixed(0) : '$v';

  double? get _amountValue =>
      double.tryParse(_amount.text.replaceAll(',', '.'));

  bool get _canSave => _selected != null && (_amountValue ?? 0) > 0;

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  void _submit() {
    final product = _selected;
    final amount = _amountValue;
    if (product == null || amount == null || amount <= 0) return;
    Navigator.of(
      context,
    ).pop(IngredientEditResult(product: product, amountG: amount));
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Изменить продукт' : 'Добавить продукт'),
      ),
      body: Column(
        children: [
          // ---- выбранный продукт + масса ----
          if (_selected != null)
            Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: scheme.primaryContainer,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: scheme.primary),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _selected!.name,
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        if (_selected!.subtitle.isNotEmpty)
                          Text(
                            _selected!.subtitle,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 96,
                    child: TextField(
                      controller: _amount,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textAlign: TextAlign.right,
                      decoration: const InputDecoration(
                        labelText: 'Масса',
                        suffixText: 'г',
                        isDense: true,
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                ],
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Row(
                children: [
                  Icon(
                    Icons.touch_app_outlined,
                    size: 18,
                    color: scheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Выберите продукт из списка ниже',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
          // ---- выбор продукта ----
          Expanded(
            child: ProductBrowser(
              selectedId: _selected?.id,
              onSelect: (p) => setState(() => _selected = p),
            ),
          ),
          // ---- подтверждение ----
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: FilledButton.icon(
                onPressed: _canSave ? _submit : null,
                icon: Icon(widget.isEdit ? Icons.check : Icons.add),
                label: Text(
                  widget.isEdit
                      ? 'Сохранить изменения'
                      : 'Добавить в рецептуру',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
