# AFACI Mobile — React Native

Мобильный клиент AFACI для Android: React Native, Expo 58, TypeScript и Expo
Router. Исходники и нативный Android-проект находятся в `rn/`.

Flutter-часть удалена. Общий сертификат dev-стенда сохранён в
`assets/certs/`: его используют генерация типов API и скрипт настройки
Android-эмулятора.

## Запуск

Нужны Node 22 LTS, JDK 17 и Android SDK 36. Команды выполняются из `rn/`:

```bash
cd rn
fnm use 22
npm install
npm run android
```

Для dev-стенда нужен root-эмулятор `afaci_rooted` на образе Google APIs
(userdebug). Настройка hosts, доверия к CA и подробные команды запуска —
в [README React Native-приложения](rn/README.md).

## Проверки

```bash
cd rn
npm run lint
npm run typecheck
npm run format:check
```

Android debug APK собирается из `rn/android/` с JDK 17:

```bash
./gradlew :app:assembleDebug
```

## Структура

```text
afaci_mobile/
  rn/
    app/                 # маршруты Expo Router
    src/shared/          # API, сессия, тема, общие UI-компоненты
    plugins/             # Expo config plugins
    scripts/             # настройка dev-эмулятора
    android/             # нативный проект Expo prebuild
    assets/              # ресурсы приложения
  assets/certs/          # общий CA dev-стенда
```

Сессия хранится в `expo-secure-store`, серверные данные — в TanStack Query,
локальное состояние — в Zustand. UI использует gluestack-ui v5 и NativeWind v5.
Формулы и конвертация единиц выполняются только на backend через `/compute`.
Самостоятельной регистрации в приложении нет.

Реализован каркас этапа 1: вход, восстановление сессии, выход, навигация
и защищённые маршруты. База продуктов, калькулятор, рецептуры и админка пока
содержат заглушки. Полный план — в [plan/mobile.md](../plan/mobile.md).
