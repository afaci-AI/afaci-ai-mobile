import 'package:intl/intl.dart';

/// Форматирование чисел в русской локали (см. план, Шаг 6/10).
class Fmt {
  static final NumberFormat _n1 = NumberFormat('#,##0.0', 'ru_RU');
  static final NumberFormat _n2 = NumberFormat('#,##0.00', 'ru_RU');
  static final NumberFormat _int = NumberFormat('#,##0', 'ru_RU');

  /// Число с одним знаком после запятой (нутриенты, ккал).
  static String n1(num? v) => v == null ? '—' : _n1.format(v);

  /// Число с двумя знаками (коэффициенты качества V, G, КРАС).
  static String n2(num? v) => v == null ? '—' : _n2.format(v);

  /// Целое (граммы, проценты скора).
  static String i(num? v) => v == null ? '—' : _int.format(v);

  /// Граммы.
  static String grams(num? v) => v == null ? '—' : '${n1(v)} г';

  /// Проценты (скор, БЦ).
  static String percent(num? v) => v == null ? '—' : '${n1(v)} %';
}
