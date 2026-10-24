# AFACI Mobile — React Native

Каркас мобильного приложения на Expo 58 + Expo Router. Заменяет Flutter-версию
поэтапно; план и статусы — в [`../../plan/mobile.md`](../../plan/mobile.md).

## Требования

- Node 22 LTS (`fnm` уже настроен, версия пинится в `.node-version`).
- JDK 17 (`JAVA_HOME`), Android SDK 36.
- Эмулятор `afaci_rooted` (образ `google_apis`, userdebug — нужен `adb root`).

## Запуск

```bash
fnm use 22                 # или fnm exec --using=22 <команда>
npm install
npm run android            # prebuild уже сделан, android/ в репозитории
```

Metro отдельно: `npm start`.

## Скрипты

| Скрипт              | Что делает                               |
| ------------------- | ---------------------------------------- |
| `npm run android`   | сборка debug APK и установка на эмулятор |
| `npm start`         | Metro                                    |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | `tsc --noEmit`                           |
| `npm run format`    | Prettier                                 |
| `npm run api:types` | генерация типов из OpenAPI dev-стенда    |

`api:types` по умолчанию берёт `https://api.foodcraftsl.lab/openapi.json` и
подключает корневой CA Caddy через `NODE_EXTRA_CA_CERTS` из
`../assets/certs/caddy_root.pem`. Свой адрес — `OPENAPI_URL=...`.

## Структура

```text
rn/
  app/                     # expo-router
  src/
    modules/               # фичевые модули
    shared/
      api/schema.d.ts      # сгенерированные типы (не править вручную)
      ui/                  # gluestack-ui компоненты
    global.css             # семантические токены (светлая/тёмная тема)
  plugins/                 # Expo config plugins
  android/                 # prebuild, коммитится
```

## Android-конфигурация

- `applicationId`: `kg.afaci.afaci_mobile`, debug — `.dev` (config plugin
  `plugins/with-debug-application-id-suffix.js`), поэтому Flutter- и
  RN-приложение могут стоять на эмуляторе одновременно.
- `versionCode 2`, `versionName 2.0.0`.
- Разрешения: `INTERNET`; overlay и legacy-storage заблокированы в `app.config.ts`.
- `android/` пересоздаётся через `npx expo prebuild --platform android --clean`;
  ручные правки нативных файлов должны переноситься в config plugins.

## Dev-стенд из эмулятора

Схема из [`ERROR.md`, п. 10](../../ERROR.md): эмулятор не видит хостовый
`/etc/hosts`, а сертификат dev-стенда подписан локальным CA Caddy.

```bash
adb root && adb remount
adb shell 'echo "10.0.2.2 api.foodcraftsl.lab" >> /system/etc/hosts'
```

Для RN/OkHttp CA должен быть в системном хранилище эмулятора (в отличие от
Flutter, где `dart:io` доверял сертификату через `dev_trust.dart`); установка
CA в системный store — часть этапа 1.
