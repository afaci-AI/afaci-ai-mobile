/// Эталонный белок ФАО/ВОЗ (`GET /calculator/reference-proteins`).
class ReferenceProtein {
  const ReferenceProtein({
    required this.id,
    required this.name,
    this.year,
    this.isDefault = false,
    this.description,
  });

  final String id;
  final String name;
  final int? year;
  final bool isDefault;
  final String? description;

  factory ReferenceProtein.fromJson(Map<String, dynamic> j) => ReferenceProtein(
    id: j['id'] as String,
    name: j['name'] as String,
    year: (j['year'] as num?)?.toInt(),
    isDefault: j['is_default'] as bool? ?? false,
    description: j['description'] as String?,
  );

  String get label => year != null ? '$name ($year)' : name;
}
