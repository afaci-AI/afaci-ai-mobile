import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/widgets.dart';
import '../../core/network/api_exception.dart';
import '../../domain/product.dart';

/// Модальный выбор продукта с поиском по `GET /table/products?product=...`.
///
/// Текстовый поиск (ILIKE) и регистронезависимость кириллицы — на бэкенде
/// (план, Шаг 5). Клиент только шлёт строку запроса.
class ProductPicker extends ConsumerStatefulWidget {
  const ProductPicker({super.key});

  /// Открыть пикер; вернёт выбранный [Product] либо null.
  static Future<Product?> show(BuildContext context) {
    return showModalBottomSheet<Product>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (_) => const FractionallySizedBox(
        heightFactor: 0.92,
        child: ProductPicker(),
      ),
    );
  }

  @override
  ConsumerState<ProductPicker> createState() => _ProductPickerState();
}

class _ProductPickerState extends ConsumerState<ProductPicker> {
  final _controller = TextEditingController();
  Timer? _debounce;
  Future<List<Product>>? _future;

  @override
  void initState() {
    super.initState();
    _future = ref.read(productsApiProvider).search(limit: 50);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      setState(() {
        _future = ref.read(productsApiProvider).search(query: value, limit: 50);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: TextField(
            controller: _controller,
            autofocus: true,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Поиск продукта…',
            ),
            onChanged: _onChanged,
          ),
        ),
        Expanded(
          child: FutureBuilder<List<Product>>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const LoadingView();
              }
              if (snap.hasError) {
                final e = snap.error;
                return ErrorView(
                  e is ApiException ? e.message : 'Ошибка загрузки',
                );
              }
              final products = snap.data ?? const [];
              if (products.isEmpty) {
                return const EmptyView(
                  'Ничего не найдено',
                  icon: Icons.search_off,
                );
              }
              return ListView.separated(
                itemCount: products.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, i) {
                  final p = products[i];
                  return ListTile(
                    title: Text(p.name),
                    subtitle: p.subtitle.isEmpty ? null : Text(p.subtitle),
                    onTap: () => Navigator.of(context).pop(p),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
