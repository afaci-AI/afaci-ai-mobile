/// Группа сохранённых рецептур (`/saved/groups`).
class RecipeGroup {
  const RecipeGroup({
    required this.id,
    required this.name,
    this.recipeCount = 0,
    this.createdAt,
  });

  final String id;
  final String name;
  final int recipeCount;
  final DateTime? createdAt;

  factory RecipeGroup.fromJson(Map<String, dynamic> j) => RecipeGroup(
    id: j['id'] as String,
    name: j['name'] as String,
    recipeCount: (j['recipe_count'] as num?)?.toInt() ?? 0,
    createdAt: j['created_at'] is String
        ? DateTime.tryParse(j['created_at'] as String)
        : null,
  );
}
