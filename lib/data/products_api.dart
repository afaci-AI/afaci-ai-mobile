import '../core/network/api_client.dart';
import '../domain/nutrient_row.dart';
import '../domain/product.dart';

/// Продукты (read-only, план Шаг 5).
///
/// Для выбора и поиска используем `GET /table/products` — он отдаёт плоские
/// строки с разыменованными FK и поддерживает ILIKE-поиск (`product=...`).
/// Регистронезависимость кириллицы — на бэкенде (локаль C), клиент не «чинит».
class ProductsApi {
  ProductsApi(this._client);
  final ApiClient _client;

  /// Поиск/листинг продуктов. [query] — фрагмент имени (ILIKE на сервере).
  Future<List<Product>> search({
    String? query,
    String? region,
    String? category,
    int limit = 100,
    int offset = 0,
  }) async {
    final data = await _client.get(
      '/table/products',
      query: {
        if (query != null && query.trim().isNotEmpty) 'product': query.trim(),
        if (region != null && region.isNotEmpty) 'region': region,
        if (category != null && category.isNotEmpty) 'category': category,
        'limit': limit,
        'offset': offset,
      },
    );
    return (data as List)
        .map((e) => Product.fromTableRow((e as Map).cast<String, dynamic>()))
        .toList();
  }

  /// Справочник регионов (для фильтра).
  Future<List<String>> regions() async {
    final data = await _client.get('/regions');
    return (data as List).map((e) => (e as Map)['name'].toString()).toList();
  }

  /// Справочник категорий (для фильтра).
  Future<List<String>> categories() async {
    final data = await _client.get('/categories');
    return (data as List).map((e) => (e as Map)['name'].toString()).toList();
  }

  /// Нутриенты конкретного продукта для карточки «Базы данных».
  ///
  /// Берём через плоскую `GET /table/nutrients` (имена компонентов и единицы
  /// уже разыменованы). Пара (name, region) уникальна в БД, поэтому фильтруем
  /// по ним и дочищаем точное совпадение имени на клиенте.
  Future<List<NutrientRow>> productNutrients({
    required String productName,
    String? region,
  }) async {
    final data = await _client.get(
      '/table/nutrients',
      query: {
        'product': productName,
        if (region != null && region.isNotEmpty) 'region': region,
        'limit': 500,
      },
    );
    return (data as List)
        .map((e) => NutrientRow.fromJson((e as Map).cast<String, dynamic>()))
        .where((r) => r.productName == productName)
        .toList();
  }
}
