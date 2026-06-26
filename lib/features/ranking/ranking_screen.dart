import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/widgets.dart';
import '../../core/format.dart';
import '../../core/network/api_exception.dart';
import '../../domain/ranking.dart';
import '../../domain/saved_recipe.dart';
import '../saved/saved_providers.dart';

/// Ранжирование рецептур по БЦ/КРАС/V/G (план, Шаг 8).
///
/// Не «оптимизация» — именно ранжирование. В UI требуем ≥ 2 рассчитанных
/// (не черновых) рецептуры для осмысленного сравнения.
class RankingView extends ConsumerStatefulWidget {
  const RankingView({super.key});
  @override
  ConsumerState<RankingView> createState() => _RankingViewState();
}

class _RankingViewState extends ConsumerState<RankingView> {
  final Set<String> _selected = {};
  RankingResult? _result;
  bool _loading = false;

  Future<void> _run() async {
    setState(() {
      _loading = true;
      _result = null;
    });
    try {
      final res = await ref
          .read(rankingApiProvider)
          .rank(recipeIds: _selected.toList());
      setState(() => _result = res);
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(savedRecipesProvider);
    return async.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(
        e is ApiException ? e.message : 'Ошибка загрузки',
        onRetry: () => ref.invalidate(savedRecipesProvider),
      ),
      data: (all) {
        // только рассчитанные рецептуры пригодны для ранжирования
        final ranked = all.where((r) => !r.isDraft).toList();
        if (ranked.length < 2) {
          return const EmptyView(
            'Нужно минимум 2 рассчитанные рецептуры.\nСохраните расчёты без флага «черновик».',
            icon: Icons.leaderboard_outlined,
          );
        }
        return Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    'Выберите рецептуры для сравнения',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  ...ranked.map(
                    (r) => _SelectableTile(
                      recipe: r,
                      selected: _selected.contains(r.id),
                      onChanged: (v) => setState(() {
                        if (v == true) {
                          _selected.add(r.id);
                        } else {
                          _selected.remove(r.id);
                        }
                        _result = null;
                      }),
                    ),
                  ),
                  if (_result != null) ...[
                    const Divider(height: 32),
                    _ResultView(result: _result!, recipes: ranked),
                  ],
                ],
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: FilledButton.icon(
                  onPressed: (_selected.length >= 2 && !_loading) ? _run : null,
                  icon: _loading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.leaderboard),
                  label: Text('Ранжировать (${_selected.length})'),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SelectableTile extends StatelessWidget {
  const _SelectableTile({
    required this.recipe,
    required this.selected,
    required this.onChanged,
  });
  final SavedRecipe recipe;
  final bool selected;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    final m = recipe.metrics;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: CheckboxListTile(
        value: selected,
        onChanged: onChanged,
        title: Text(recipe.name),
        subtitle: Text(
          'БЦ ${Fmt.n1(m.bc)}%  •  КРАС ${Fmt.n2(m.kras)}  •  V ${Fmt.n2(m.v)}  •  G ${Fmt.n2(m.g)}',
        ),
      ),
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({required this.result, required this.recipes});
  final RankingResult result;
  final List<SavedRecipe> recipes;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Результат', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...result.ranking.map((e) {
          final isWinner = e.recipeId == result.winner;
          return Card(
            color: isWinner ? scheme.primaryContainer : null,
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: isWinner ? scheme.primary : null,
                foregroundColor: isWinner ? scheme.onPrimary : null,
                child: Text('${e.rank}'),
              ),
              title: Text(e.name),
              subtitle: Text(
                'БЦ ${Fmt.n1(e.bc)}%  •  КРАС ${Fmt.n2(e.kras)}  •  V ${Fmt.n2(e.v)}  •  G ${Fmt.n2(e.g)}',
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    Fmt.n2(e.composite),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  if (isWinner)
                    Text(
                      'лучшая',
                      style: TextStyle(fontSize: 11, color: scheme.primary),
                    ),
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: 4),
        Text(
          'Веса: БЦ ${Fmt.n2(result.weights.bc)} • КРАС ${Fmt.n2(result.weights.kras)} • V ${Fmt.n2(result.weights.v)} • G ${Fmt.n2(result.weights.g)}',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
