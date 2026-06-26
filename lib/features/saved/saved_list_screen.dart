import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/widgets.dart';
import '../../core/format.dart';
import '../../core/network/api_exception.dart';
import '../../domain/recipe_group.dart';
import '../../domain/saved_recipe.dart';
import 'saved_providers.dart';

/// Список сохранённых рецептур с группировкой (план, Шаг 7).
///
/// Body-only: используется как вкладка внутри «Рецептуры» (RecipesHubScreen),
/// поэтому без собственного Scaffold/AppBar.
class SavedRecipesView extends ConsumerWidget {
  const SavedRecipesView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recipesAsync = ref.watch(savedRecipesProvider);
    final groupsAsync = ref.watch(recipeGroupsProvider);

    return recipesAsync.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(
        e is ApiException ? e.message : 'Не удалось загрузить рецептуры',
        onRetry: () => ref.invalidate(savedRecipesProvider),
      ),
      data: (recipes) {
        if (recipes.isEmpty) {
          return const EmptyView(
            'Пока нет сохранённых рецептур.\nСоздайте расчёт и нажмите «Сохранить».',
            icon: Icons.bookmark_border,
          );
        }
        final groups = groupsAsync.asData?.value ?? const <RecipeGroup>[];
        final names = {for (final g in groups) g.id: g.name};

        // группировка: сначала по группам, затем «Без группы»
        final byGroup = <String?, List<SavedRecipe>>{};
        for (final r in recipes) {
          byGroup.putIfAbsent(r.groupId, () => []).add(r);
        }
        final sortedKeys = byGroup.keys.toList()
          ..sort((a, b) {
            if (a == null) return 1;
            if (b == null) return -1;
            return (names[a] ?? '').compareTo(names[b] ?? '');
          });

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(savedRecipesProvider);
            ref.invalidate(recipeGroupsProvider);
            await ref.read(savedRecipesProvider.future);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              for (final key in sortedKeys) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 12, 4, 4),
                  child: Text(
                    key == null ? 'Без группы' : (names[key] ?? 'Группа'),
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
                ...byGroup[key]!.map((r) => _RecipeCard(recipe: r)),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _RecipeCard extends StatelessWidget {
  const _RecipeCard({required this.recipe});
  final SavedRecipe recipe;

  @override
  Widget build(BuildContext context) {
    final m = recipe.metrics;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(recipe.name),
        subtitle: recipe.isDraft
            ? const Text('Черновик (без расчёта)')
            : Wrap(
                spacing: 12,
                children: [
                  Text('БЦ ${Fmt.n1(m.bc)}%'),
                  Text('КРАС ${Fmt.n2(m.kras)}'),
                  Text('V ${Fmt.n2(m.v)}'),
                  Text('G ${Fmt.n2(m.g)}'),
                ],
              ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.pushNamed(
          'saved-detail',
          pathParameters: {'id': recipe.id},
        ),
      ),
    );
  }
}
