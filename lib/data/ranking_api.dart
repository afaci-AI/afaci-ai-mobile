import '../core/network/api_client.dart';
import '../domain/ranking.dart';

/// Ранжирование рецептур (план, Шаг 8). НЕ «оптимизация».
///
/// Тело: `{recipe_ids: [...], weights?: {bc, kras, v, g}}`.
/// Бэкенд принимает ≥ 1 рецептуру (400 только при пустом массиве), но в UI
/// требуем ≥ 2 для осмысленного сравнения.
class RankingApi {
  RankingApi(this._client);
  final ApiClient _client;

  Future<RankingResult> rank({
    required List<String> recipeIds,
    RankingWeights? weights,
  }) async {
    final data = await _client.post(
      '/saved/ranking',
      body: {
        'recipe_ids': recipeIds,
        if (weights != null) 'weights': weights.toJson(),
      },
    );
    return RankingResult.fromJson((data as Map).cast<String, dynamic>());
  }
}
