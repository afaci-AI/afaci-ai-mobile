import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';

/// Справочники для фильтров «Базы данных» (Шаг 5: read-only).
final categoriesProvider = FutureProvider<List<String>>((ref) async {
  return ref.watch(productsApiProvider).categories();
});

final regionsProvider = FutureProvider<List<String>>((ref) async {
  return ref.watch(productsApiProvider).regions();
});
