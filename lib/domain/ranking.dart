// Ранжирование рецептур (`POST /saved/ranking`). Контракт — план, Шаг 8.
// Это именно «ранжирование», а не «оптимизация» (см. план, Шаг 8).

class RankingWeights {
  const RankingWeights({
    this.bc = 0.25,
    this.kras = 0.25,
    this.v = 0.25,
    this.g = 0.25,
  });

  final double bc;
  final double kras;
  final double v;
  final double g;

  Map<String, dynamic> toJson() => {'bc': bc, 'kras': kras, 'v': v, 'g': g};

  factory RankingWeights.fromJson(Map<String, dynamic> j) => RankingWeights(
    bc: (j['bc'] as num?)?.toDouble() ?? 0.25,
    kras: (j['kras'] as num?)?.toDouble() ?? 0.25,
    v: (j['v'] as num?)?.toDouble() ?? 0.25,
    g: (j['g'] as num?)?.toDouble() ?? 0.25,
  );
}

class RankingEntry {
  const RankingEntry({
    required this.recipeId,
    required this.name,
    this.group,
    this.bc,
    this.kras,
    this.v,
    this.g,
    required this.composite,
    required this.rank,
  });

  final String recipeId;
  final String name;
  final String? group;
  final double? bc;
  final double? kras;
  final double? v;
  final double? g;
  final double composite;
  final int rank;

  factory RankingEntry.fromJson(Map<String, dynamic> j) => RankingEntry(
    recipeId: j['recipe_id'] as String,
    name: j['name'] as String? ?? '',
    group: j['group'] as String?,
    bc: (j['bc'] as num?)?.toDouble(),
    kras: (j['kras'] as num?)?.toDouble(),
    v: (j['V'] as num?)?.toDouble(),
    g: (j['G'] as num?)?.toDouble(),
    composite: (j['composite'] as num?)?.toDouble() ?? 0,
    rank: (j['rank'] as num?)?.toInt() ?? 0,
  );
}

class RankingResult {
  const RankingResult({
    required this.weights,
    required this.winner,
    required this.ranking,
  });

  final RankingWeights weights;
  final String winner;
  final List<RankingEntry> ranking;

  factory RankingResult.fromJson(Map<String, dynamic> j) => RankingResult(
    weights: RankingWeights.fromJson(
      (j['weights'] as Map?)?.cast<String, dynamic>() ?? const {},
    ),
    winner: j['winner']?.toString() ?? '',
    ranking: (j['ranking'] as List? ?? [])
        .map((e) => RankingEntry.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}
