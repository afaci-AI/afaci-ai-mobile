// Базовый smoke-тест: приложение собирается и показывает MaterialApp.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:afaci_mobile/app/providers.dart';
import 'package:afaci_mobile/features/update/download_service.dart';
import 'package:afaci_mobile/features/update/install_service.dart';
import 'package:afaci_mobile/features/update/update_api.dart';
import 'package:afaci_mobile/features/update/update_controller.dart';

import 'package:afaci_mobile/main.dart';

void main() {
  testWidgets('App boots into a MaterialApp', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          // Отключаем проверку обновлений: она ходит в сеть и `package_info`,
          // что вне реального приложения оставляет «зависший» таймер.
          appUpdateProvider.overrideWith(
            (ref) => _NoopUpdateController(),
          ),
        ],
        child: const AfaciApp(),
      ),
    );
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}

/// Контроллер-заглушка, не выполняющий реального сетевого запроса.
class _NoopUpdateController extends AppUpdateController {
  _NoopUpdateController()
      : super(
          updateApi: UpdateApi(),
          downloadService: DownloadService(),
          installService: InstallService(),
        );

  @override
  Future<void> checkForUpdate() async {}
}
