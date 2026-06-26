import 'package:flutter/material.dart';

import '../auth/auth_gate.dart';
import '../auth/profile_screen.dart';
import '../calculator/calculator_screen.dart';
import '../database/database_screen.dart';
import '../saved/recipes_hub_screen.dart';

/// Корневой экран с нижней навигацией.
///
/// Модель доступа как на сайте: «База данных» открыта всем, остальное —
/// после входа (калькулятор и «Рецептуры» закрыты AuthGate). Ранжирование и
/// оптимизация вынесены внутрь вкладки «Рецептуры», чтобы не перегружать
/// нижнюю навигацию.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _tabs = [
    DatabaseScreen(),
    AuthGate(
      title: 'Калькулятор',
      message:
          'Калькулятор пищевой и биологической ценности доступен после входа.',
      child: CalculatorScreen(),
    ),
    RecipesHubScreen(),
    AuthGate(
      title: 'Профиль',
      message: 'Войдите, чтобы видеть профиль и управлять аккаунтом.',
      child: ProfileScreen(),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.storage_outlined),
            selectedIcon: Icon(Icons.storage),
            label: 'База данных',
          ),
          NavigationDestination(
            icon: Icon(Icons.calculate_outlined),
            selectedIcon: Icon(Icons.calculate),
            label: 'Калькулятор',
          ),
          NavigationDestination(
            icon: Icon(Icons.bookmark_border),
            selectedIcon: Icon(Icons.bookmark),
            label: 'Рецептуры',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Профиль',
          ),
        ],
      ),
    );
  }
}
