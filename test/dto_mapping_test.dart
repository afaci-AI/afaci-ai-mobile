import 'package:flutter_test/flutter_test.dart';

import 'package:afaci_mobile/domain/user.dart';
import 'package:afaci_mobile/domain/compute_report.dart';
import 'package:afaci_mobile/domain/saved_recipe.dart';
import 'package:afaci_mobile/domain/ranking.dart';
import 'package:afaci_mobile/domain/cost_optimization.dart';

void main() {
  group('User.fromJson', () {
    test('читает camelCase из user_public', () {
      final u = User.fromJson({
        'id': 'u1',
        'email': 'a@b.kg',
        'name': 'Айгуль',
        'role': 'viewer',
        'isActive': true,
        'createdAt': '2026-06-25T10:00:00+00:00',
        'lastLoginAt': null,
      });
      expect(u.id, 'u1');
      expect(u.name, 'Айгуль');
      expect(u.isActive, true);
      expect(u.createdAt, isNotNull);
      expect(u.lastLoginAt, isNull);
    });
  });

  group('ComputeReport.fromJson', () {
    test('маппит макро, качество и лимитирующие АК', () {
      final r = ComputeReport.fromJson({
        'recipe': [
          {'product_id': 'p1', 'name': 'Говядина', 'amount_g': 70.0},
        ],
        'sum_g': 100.0,
        'reference': {'id': 'ref', 'name': 'ФАО', 'year': 1985},
        'macro': {'protein': 18.5, 'fat': 12.0, 'protein_fat_ratio': 1.54},
        'energy_kcal': 187.3,
        'amino_acids': [
          {'name': 'ИЗО', 'm_j': 45.0, 'score': 78.3, 'is_limiting': true},
        ],
        'c_min': {'name': 'ИЗО', 'score': 78.3},
        'limiting': ['ИЗО', 'Лиз'],
        'limiting_count': 2,
        'quality': {'kras': 12.1, 'bc': 87.9, 'V': 0.88, 'G': 2.34},
        'amino_contributors': ['Говядина'],
        'warnings': [],
      });

      expect(r.sumG, 100.0);
      expect(r.macro.protein, 18.5);
      expect(r.macro.proteinFatRatio, 1.54);
      expect(r.quality.bc, 87.9);
      expect(r.quality.v, 0.88); // V (заглавная в JSON) → v
      expect(r.limitingCount, 2);
      expect(r.aminoAcids.single.isLimiting, true);
      expect(r.cMin!.name, 'ИЗО');
    });

    test('терпит отсутствующие/пустые поля', () {
      final r = ComputeReport.fromJson({'sum_g': 0});
      expect(r.recipe, isEmpty);
      expect(r.warnings, isEmpty);
      expect(r.quality.bc, isNull);
      expect(r.cMin, isNull);
    });
  });

  group('SavedRecipe.fromJson', () {
    test('черновик без метрик распознаётся', () {
      final r = SavedRecipe.fromJson({
        'id': 'r1',
        'name': 'Черновик',
        'group_id': null,
        'reference_protein_id': 'ref1',
        'metrics': {'bc': null, 'kras': null, 'V': null, 'G': null},
      });
      expect(r.isDraft, true);
    });

    test('рассчитанная рецептура с метриками V/G', () {
      final r = SavedRecipe.fromJson({
        'id': 'r2',
        'name': 'Котлеты',
        'reference_protein_id': 'ref1',
        'metrics': {'bc': 88.0, 'kras': 12.0, 'V': 0.9, 'G': 2.1},
        'items': [
          {'product_id': 'p1', 'amount_g': 70.0, 'sort_order': 0},
        ],
      });
      expect(r.isDraft, false);
      expect(r.metrics.v, 0.9);
      expect(r.items.single.amountG, 70.0);
    });
  });

  group('RankingResult.fromJson', () {
    test('маппит победителя и ранги', () {
      final res = RankingResult.fromJson({
        'weights': {'bc': 0.25, 'kras': 0.25, 'v': 0.25, 'g': 0.25},
        'winner': 'r2',
        'ranking': [
          {
            'recipe_id': 'r2',
            'name': 'B',
            'composite': 0.82,
            'rank': 1,
            'V': 0.9,
          },
          {'recipe_id': 'r1', 'name': 'A', 'composite': 0.61, 'rank': 2},
        ],
      });
      expect(res.winner, 'r2');
      expect(res.ranking.first.rank, 1);
      expect(res.ranking.first.v, 0.9);
    });
  });

  group('CostOptimizationResult.fromJson', () {
    test('маппит стоимость, оптимальный состав и вложенный отчёт', () {
      final res = CostOptimizationResult.fromJson({
        'optimal_items': [
          {'product_id': 'p1', 'amount_g': 62.5, 'price_per_kg': 450.0},
          {'product_id': 'p2', 'amount_g': 37.5, 'price_per_kg': 120.0},
        ],
        'total_cost_per_100g': 32.62,
        'report': {
          'sum_g': 100.0,
          'recipe': [
            {'product_id': 'p1', 'name': 'Говядина', 'amount_g': 62.5},
            {'product_id': 'p2', 'name': 'Соя', 'amount_g': 37.5},
          ],
          'quality': {'bc': 85.0, 'kras': 14.0, 'V': 0.87, 'G': 2.0},
        },
      });
      expect(res.totalCostPer100g, 32.62);
      expect(res.optimalItems.length, 2);
      expect(res.optimalItems.first.amountG, 62.5);
      // имена доступны из вложенного отчёта (разыменованные FK)
      expect(res.report.recipe.first.name, 'Говядина');
      expect(res.report.quality.bc, 85.0);
    });
  });
}
