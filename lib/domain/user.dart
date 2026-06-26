/// Пользователь. Бэкенд (`user_public`) отдаёт camelCase — это учтено
/// в [User.fromJson] (см. план, Шаг 4).
class User {
  const User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.isActive,
    this.createdAt,
    this.lastLoginAt,
  });

  final String id;
  final String email;
  final String name;
  final String role;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? lastLoginAt;

  factory User.fromJson(Map<String, dynamic> j) => User(
    id: j['id'] as String,
    email: j['email'] as String,
    name: j['name'] as String,
    role: j['role'] as String,
    isActive: j['isActive'] as bool? ?? true,
    createdAt: _date(j['createdAt']),
    lastLoginAt: _date(j['lastLoginAt']),
  );

  static DateTime? _date(Object? v) =>
      v is String ? DateTime.tryParse(v) : null;
}
