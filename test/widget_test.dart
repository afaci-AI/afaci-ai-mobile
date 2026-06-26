// Базовый smoke-тест: приложение собирается и показывает MaterialApp.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:afaci_mobile/main.dart';

void main() {
  testWidgets('App boots into a MaterialApp', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: AfaciApp()));
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
