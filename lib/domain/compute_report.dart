/// Отчёт `POST /calculator/compute`. Структура — из плана, Шаг 6.
///
/// Все формулы Липатова считаются на сервере; клиент только отображает
/// (CLAUDE.md / план, Шаг 0 — не дублируем расчёт).
class ComputeReport {
  const ComputeReport({
    required this.recipe,
    required this.sumG,
    required this.reference,
    required this.macro,
    required this.energyKcal,
    required this.aminoAcids,
    required this.cMin,
    required this.limiting,
    required this.limitingCount,
    required this.quality,
    required this.aminoContributors,
    required this.warnings,
    this.verdict,
  });

  final List<RecipeLine> recipe;
  final double sumG;
  final ReferenceInfo reference;
  final Macro macro;
  final double? energyKcal;
  final List<AminoAcid> aminoAcids;
  final CMin? cMin;
  final List<String> limiting;
  final int limitingCount;
  final Quality quality;
  final List<String> aminoContributors;
  final List<String> warnings;
  final Map<String, dynamic>? verdict;

  factory ComputeReport.fromJson(Map<String, dynamic> j) => ComputeReport(
    recipe: (j['recipe'] as List? ?? [])
        .map((e) => RecipeLine.fromJson(e as Map<String, dynamic>))
        .toList(),
    sumG: _d(j['sum_g']) ?? 0,
    reference: ReferenceInfo.fromJson(
      (j['reference'] as Map?)?.cast<String, dynamic>() ?? const {},
    ),
    macro: Macro.fromJson(
      (j['macro'] as Map?)?.cast<String, dynamic>() ?? const {},
    ),
    energyKcal: _d(j['energy_kcal']),
    aminoAcids: (j['amino_acids'] as List? ?? [])
        .map((e) => AminoAcid.fromJson(e as Map<String, dynamic>))
        .toList(),
    cMin: j['c_min'] == null
        ? null
        : CMin.fromJson((j['c_min'] as Map).cast<String, dynamic>()),
    limiting: (j['limiting'] as List? ?? []).map((e) => e.toString()).toList(),
    limitingCount: (j['limiting_count'] as num?)?.toInt() ?? 0,
    quality: Quality.fromJson(
      (j['quality'] as Map?)?.cast<String, dynamic>() ?? const {},
    ),
    aminoContributors: (j['amino_contributors'] as List? ?? [])
        .map((e) => e.toString())
        .toList(),
    warnings: (j['warnings'] as List? ?? []).map((e) => e.toString()).toList(),
    verdict: (j['verdict'] as Map?)?.cast<String, dynamic>(),
  );
}

class RecipeLine {
  const RecipeLine({
    required this.productId,
    required this.name,
    this.region,
    this.subcategory,
    required this.amountG,
  });

  final String productId;
  final String name;
  final String? region;
  final String? subcategory;
  final double amountG;

  factory RecipeLine.fromJson(Map<String, dynamic> j) => RecipeLine(
    productId: j['product_id'].toString(),
    name: j['name'] as String? ?? '',
    region: j['region'] as String?,
    subcategory: j['subcategory'] as String?,
    amountG: _d(j['amount_g']) ?? 0,
  );
}

class ReferenceInfo {
  const ReferenceInfo({this.id, this.name, this.year, this.description});

  final String? id;
  final String? name;
  final int? year;
  final String? description;

  factory ReferenceInfo.fromJson(Map<String, dynamic> j) => ReferenceInfo(
    id: j['id']?.toString(),
    name: j['name'] as String?,
    year: (j['year'] as num?)?.toInt(),
    description: j['description'] as String?,
  );
}

class Macro {
  const Macro({
    this.protein,
    this.fat,
    this.carb,
    this.fiber,
    this.proteinFatRatio,
  });

  final double? protein;
  final double? fat;
  final double? carb;
  final double? fiber;
  final double? proteinFatRatio;

  factory Macro.fromJson(Map<String, dynamic> j) => Macro(
    protein: _d(j['protein']),
    fat: _d(j['fat']),
    carb: _d(j['carb']),
    fiber: _d(j['fiber']),
    proteinFatRatio: _d(j['protein_fat_ratio']),
  );
}

class AminoAcid {
  const AminoAcid({
    required this.name,
    this.mJ,
    this.reference,
    this.score,
    this.utility,
    this.isLimiting = false,
    this.isMin = false,
  });

  final String name;
  final double? mJ;
  final double? reference;
  final double? score;
  final double? utility;
  final bool isLimiting;
  final bool isMin;

  factory AminoAcid.fromJson(Map<String, dynamic> j) => AminoAcid(
    name: j['name'] as String? ?? '',
    mJ: _d(j['m_j']),
    reference: _d(j['reference']),
    score: _d(j['score']),
    utility: _d(j['utility']),
    isLimiting: j['is_limiting'] as bool? ?? false,
    isMin: j['is_min'] as bool? ?? false,
  );
}

class CMin {
  const CMin({required this.name, required this.score});
  final String name;
  final double? score;

  factory CMin.fromJson(Map<String, dynamic> j) =>
      CMin(name: j['name'] as String? ?? '', score: _d(j['score']));
}

class Quality {
  const Quality({this.kras, this.bc, this.v, this.g});

  final double? kras;
  final double? bc;
  final double? v;
  final double? g;

  factory Quality.fromJson(Map<String, dynamic> j) => Quality(
    kras: _d(j['kras']),
    bc: _d(j['bc']),
    v: _d(j['V']),
    g: _d(j['G']),
  );
}

double? _d(Object? v) => v == null ? null : (v as num).toDouble();
