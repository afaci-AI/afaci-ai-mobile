import 'package:flutter/material.dart';

/// Тема приложения — повторяет стилистику веб-сайта (`afaci-frontend`).
///
/// Сайт построен на shadcn/ui с синим primary (`oklch(0.55 0.15 250)`),
/// холодным светло-серым фоном и радиусом 0.5rem. Здесь те же токены,
/// сконвертированные в sRGB, чтобы мобилка выглядела как сайт.
class AppTheme {
  // Палитра сайта (globals.css), переведённая из oklch в sRGB.
  static const Color primary = Color(0xFF0F6FBE); // oklch(0.55 0.15 250)
  static const Color _bgLight = Color(0xFFF4F5F7); // oklch(0.97 0.005 250)
  static const Color _fgLight = Color(0xFF2B2F36); // oklch(0.20 0.02 250)
  static const Color _borderLight = Color(0xFFDFE3E8); // oklch(0.90 0.01 250)
  static const Color _mutedFgLight = Color(0xFF6B7280); // oklch(0.50 0.02 250)
  static const Color _destructive = Color(0xFFCC3A2B); // oklch(0.55 0.22 25)

  static const Color _bgDark = Color(0xFF111316);
  static const Color _surfaceDark = Color(0xFF1A1D21);

  static const double _radius = 8; // 0.5rem

  static ThemeData light() {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: primary,
      onPrimary: Colors.white,
      secondary: Color(0xFFEDEFF2),
      onSecondary: _fgLight,
      error: _destructive,
      onError: Colors.white,
      surface: Colors.white,
      onSurface: _fgLight,
      surfaceContainerLowest: Colors.white,
      surfaceContainerLow: _bgLight,
      surfaceContainer: Color(0xFFF0F2F4),
      surfaceContainerHigh: Color(0xFFEAECEF),
      onSurfaceVariant: _mutedFgLight,
      outline: _borderLight,
      outlineVariant: _borderLight,
      primaryContainer: Color(0xFFE3EEF8),
      onPrimaryContainer: Color(0xFF0B4D85),
    );
    return _base(scheme, _bgLight);
  }

  static ThemeData dark() {
    const scheme = ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xFF5AA9E6),
      onPrimary: Color(0xFF0A2A45),
      secondary: Color(0xFF272B30),
      onSecondary: Colors.white,
      error: Color(0xFFE5806F),
      onError: Color(0xFF3A0E08),
      surface: _surfaceDark,
      onSurface: Color(0xFFE6E8EA),
      surfaceContainerLowest: _bgDark,
      surfaceContainerLow: _surfaceDark,
      surfaceContainer: Color(0xFF212429),
      surfaceContainerHigh: Color(0xFF272B30),
      onSurfaceVariant: Color(0xFFA0A6AD),
      outline: Color(0xFF373B41),
      outlineVariant: Color(0xFF2D3035),
      primaryContainer: Color(0xFF153A5C),
      onPrimaryContainer: Color(0xFFCDE3F7),
    );
    return _base(scheme, _bgDark);
  }

  static ThemeData _base(ColorScheme scheme, Color scaffoldBg) {
    final radius = BorderRadius.circular(_radius);
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scaffoldBg,
      appBarTheme: AppBarTheme(
        backgroundColor: scaffoldBg,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: scheme.onSurface,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        indicatorColor: scheme.primaryContainer,
        elevation: 0,
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: radius),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: radius),
          side: BorderSide(color: scheme.outline),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surface,
        border: OutlineInputBorder(borderRadius: radius),
        enabledBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: scheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: radius,
          borderSide: BorderSide(color: scheme.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 12,
        ),
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_radius + 4),
          side: BorderSide(color: scheme.outline),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: scheme.surfaceContainerHigh,
        side: BorderSide(color: scheme.outline),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
      dividerTheme: DividerThemeData(color: scheme.outlineVariant, space: 1),
    );
  }
}
