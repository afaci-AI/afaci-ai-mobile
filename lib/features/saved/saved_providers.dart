import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../domain/recipe_group.dart';
import '../../domain/saved_recipe.dart';

/// Списки сохранённых рецептур и групп (план, Шаг 7).
final savedRecipesProvider = FutureProvider<List<SavedRecipe>>((ref) async {
  return ref.watch(savedApiProvider).recipes();
});

final recipeGroupsProvider = FutureProvider<List<RecipeGroup>>((ref) async {
  return ref.watch(savedApiProvider).groups();
});

/// Одна рецептура с составом.
final savedRecipeProvider = FutureProvider.family<SavedRecipe, String>((
  ref,
  id,
) async {
  return ref.watch(savedApiProvider).recipe(id);
});

/// Сбросить кэш списков после мутаций (вызывается из виджетов).
void invalidateSaved(WidgetRef ref) {
  ref.invalidate(savedRecipesProvider);
  ref.invalidate(recipeGroupsProvider);
}
