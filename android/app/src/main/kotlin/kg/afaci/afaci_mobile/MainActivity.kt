package kg.afaci.afaci_mobile

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "afaci/install_permission"
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "canRequestPackageInstalls" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        result.success(packageManager.canRequestPackageInstalls())
                    } else {
                        result.success(true)
                    }
                }
                "openManageUnknownAppSources" -> {
                    openManageUnknownAppSources()
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun openManageUnknownAppSources() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
        intent.data = Uri.parse("package:$packageName")
        try {
            startActivity(intent)
        } catch (_: Exception) {
            // На части девайсов экран недоступен — пробуем общий.
            try {
                startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES))
            } catch (_: Exception) {
                // Игнорируем: пользователь увидит системный диалог при запуске
                // инсталлятора через ACTION_VIEW.
            }
        }
    }
}
