/// Продукт в «плоском» виде из `GET /table/products`
/// (колонки: product_id, product_name, category_name, subcategory_name, region_name).
///
/// Это основной источник для выбора/поиска продуктов на клиенте — он уже
/// разыменовывает FK и поддерживает ILIKE-поиск на бэкенде (локаль C —
/// регистронезависимость это ответственность сервера, см. план, Шаг 5).
class Product {
  const Product({
    required this.id,
    required this.name,
    this.category,
    this.subcategory,
    this.region,
  });

  final String id;
  final String name;
  final String? category;
  final String? subcategory;
  final String? region;

  /// Из строки `GET /table/products`.
  factory Product.fromTableRow(Map<String, dynamic> j) => Product(
    id: j['product_id'] as String,
    name: j['product_name'] as String? ?? '',
    category: j['category_name'] as String?,
    subcategory: j['subcategory_name'] as String?,
    region: j['region_name'] as String?,
  );

  String get subtitle => [
    region,
    subcategory ?? category,
  ].where((s) => s != null && s.isNotEmpty).join(' • ');
}
