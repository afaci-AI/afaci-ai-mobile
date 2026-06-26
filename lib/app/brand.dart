import 'package:flutter/material.dart';

/// Логотип AFACI — иконка «база данных» в скруглённом primary-квадрате
/// и подпись. Повторяет брендинг сайта (site-header / login).
class BrandMark extends StatelessWidget {
  const BrandMark({this.size = 36, this.showText = true, super.key});

  final double size;
  final bool showText;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final square = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: scheme.primary,
        borderRadius: BorderRadius.circular(size * 0.28),
      ),
      child: Icon(
        Icons.storage_rounded,
        color: scheme.onPrimary,
        size: size * 0.55,
      ),
    );
    if (!showText) return square;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        square,
        const SizedBox(width: 10),
        Text(
          'AFACI',
          style: TextStyle(
            fontSize: size * 0.5,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
            color: scheme.onSurface,
          ),
        ),
      ],
    );
  }
}
