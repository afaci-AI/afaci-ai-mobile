import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/brand.dart';
import '../products/product_browser.dart';

/// База данных продуктов — публичный экран (доступен без входа, см. модель
/// сайта: продукты открыты всем, остальное — после регистрации).
///
/// Поиск, фильтры и постраничную подгрузку выполняет [ProductBrowser].
class DatabaseScreen extends StatelessWidget {
  const DatabaseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(titleSpacing: 16, title: const BrandMark(size: 30)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'База данных',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Продукты питания и нутриентный состав по регионам Кыргызстана',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Expanded(
            child: ProductBrowser(
              onSelect: (p) => context.pushNamed('product-detail', extra: p),
            ),
          ),
        ],
      ),
    );
  }
}
