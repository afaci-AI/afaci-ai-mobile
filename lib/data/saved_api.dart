import '../core/network/api_client.dart';
import '../domain/recipe_group.dart';
import '../domain/saved_recipe.dart';

/// Сохранённые рецептуры и группы (план, Шаг 7). Все эндпоинты — JWT.
class SavedApi {
  SavedApi(this._client);
  final ApiClient _client;

  // ----------------------------- группы -----------------------------
  Future<List<RecipeGroup>> groups() async {
    final data = await _client.get('/saved/groups');
    return (data as List)
        .map((e) => RecipeGroup.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<RecipeGroup> createGroup(String name) async {
    final data = await _client.post('/saved/groups', body: {'name': name});
    return RecipeGroup.fromJson((data as Map).cast<String, dynamic>());
  }

  Future<void> renameGroup(String groupId, String name) =>
      _client.patch('/saved/groups/$groupId', body: {'name': name});

  Future<void> deleteGroup(String groupId) =>
      _client.delete('/saved/groups/$groupId');

  // --------------------------- рецептуры ----------------------------
  Future<List<SavedRecipe>> recipes() async {
    final data = await _client.get('/saved/recipes');
    return (data as List)
        .map((e) => SavedRecipe.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<SavedRecipe> recipe(String id) async {
    final data = await _client.get('/saved/recipes/$id');
    return SavedRecipe.fromJson((data as Map).cast<String, dynamic>());
  }

  /// Сохранить рецептуру.
  ///
  /// - [draft] = true → бэкенд не считает метрики (черновик);
  /// - [newGroupName] → создать новую группу «на лету» (вместо POST /groups).
  Future<SavedRecipe> createRecipe({
    required String name,
    required String referenceProteinId,
    required List<SavedRecipeItem> items,
    String? groupId,
    String? newGroupName,
    bool draft = false,
  }) async {
    final data = await _client.post(
      '/saved/recipes',
      body: {
        'name': name,
        'reference_protein_id': referenceProteinId,
        'items': items.map((e) => e.toJson()).toList(),
        if (groupId != null) 'group_id': groupId,
        if (newGroupName != null && newGroupName.trim().isNotEmpty)
          'new_group_name': newGroupName.trim(),
        'draft': draft,
      },
    );
    return SavedRecipe.fromJson((data as Map).cast<String, dynamic>());
  }

  Future<SavedRecipe> updateRecipe(
    String id, {
    String? name,
    String? groupId,
    String? referenceProteinId,
    List<SavedRecipeItem>? items,
    bool? draft,
  }) async {
    final data = await _client.patch(
      '/saved/recipes/$id',
      body: {
        if (name != null) 'name': name,
        if (groupId != null) 'group_id': groupId,
        if (referenceProteinId != null)
          'reference_protein_id': referenceProteinId,
        if (items != null) 'items': items.map((e) => e.toJson()).toList(),
        if (draft != null) 'draft': draft,
      },
    );
    return SavedRecipe.fromJson((data as Map).cast<String, dynamic>());
  }

  Future<void> deleteRecipe(String id) => _client.delete('/saved/recipes/$id');
}
