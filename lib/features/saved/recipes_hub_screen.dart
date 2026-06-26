import 'package:flutter/material.dart';

import '../auth/auth_gate.dart';
import '../optimize/optimize_screen.dart';
import '../ranking/ranking_screen.dart';
import 'saved_list_screen.dart';

/// Вкладка «Рецептуры»: сохранённые рецептуры, ранжирование и оптимизация
/// стоимости в одном месте — чтобы не перегружать нижнюю навигацию.
///
/// Весь раздел доступен только после входа (как на сайте: рецептуры и
/// ранжирование — для авторизованных).
class RecipesHubScreen extends StatelessWidget {
  const RecipesHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AuthGate(
      title: 'Рецептуры',
      message:
          'Сохраняйте рассчитанные рецептуры, сравнивайте их ранжированием и '
          'подбирайте дешевейший состав. Войдите, чтобы продолжить.',
      child: DefaultTabController(
        length: 3,
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Рецептуры'),
            bottom: const TabBar(
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              tabs: [
                Tab(text: 'Сохранённые'),
                Tab(text: 'Ранжирование'),
                Tab(text: 'Стоимость'),
              ],
            ),
          ),
          body: const TabBarView(
            children: [SavedRecipesView(), RankingView(), OptimizeView()],
          ),
        ),
      ),
    );
  }
}
