# AFACI Mobile — React Native

Мобильный клиент AFACI для Android: React Native 0.88, Expo 58, TypeScript
strict и Expo Router. Исходники, нативный Android-проект и конфигурация
находятся в корне этого репозитория.

Flutter-клиент удалён, каталог `rn/` расформирован: приложение живёт в корне.
План и статусы этапов — в [`plan/mobile.md`](../plan/mobile.md).
Правила дизайна — [docx/mobile/DESIGN.md](../docx/mobile/DESIGN.md);
для UI использовать gluestack-ui v5 и профильные навыки этой библиотеки.
Проектный документ подпроекта — [docs/mobile/README.md](../docs/mobile/README.md).

## Требования

- Node 22 LTS, версия пинится в `.node-version`. `fnm` установлен, но не
  подключён к shell-профилю, поэтому в каждом новом терминале нужен
  `eval "$(fnm env)"` перед `fnm use 22`.
- JDK 17 (`JAVA_HOME`), Android SDK 36.
- Эмулятор `afaci_rooted` (образ `google_apis`, userdebug — нужен `adb root`).

## Запуск

Команды выполняются из `afaci_mobile`. Dev-стенд `https://api.foodcraftsl.lab`
должен быть запущен на хосте. Нужен AVD **`afaci_rooted` на образе Google APIs
(userdebug)**: образ Google Play не поддерживает `adb root`.

### 1. Подготовить терминал

```bash
cd /Users/erikomaraliev/Documents/Development/python/afaci_project_intelect/afaci_mobile
eval "$(fnm env)"
fnm use 22
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
npm install
```

Если AVD ещё нет, создайте его в Android Studio → Device Manager → Create
Virtual Device: выберите ARM64-образ **Google APIs**, SDK 36, имя
`afaci_rooted`. Проверить наличие: `emulator -list-avds`.

### 2. Запустить root-эмулятор в отдельном терминале

Сначала закройте уже запущенный экземпляр этого AVD, если он стартовал без
`-writable-system`. Данные эмулятора удалять не нужно.

```bash
"$HOME/Library/Android/sdk/emulator/emulator" \
  -avd afaci_rooted -writable-system -no-snapshot
```

Дождитесь рабочего стола Android; оставьте этот терминал открытым.

### 3. Проверить root и подключить dev-стенд

В первом терминале:

```bash
adb devices -l
adb wait-for-device
adb root
adb wait-for-device
adb shell id
./scripts/dev-emulator.sh
adb shell ping -c 1 api.foodcraftsl.lab
```

`id` должен показать `uid=0(root)`, а ping — адрес `10.0.2.2`.
`dev-emulator.sh` настраивает hosts и системное доверие к dev-CA.
Повторяйте скрипт после каждой перезагрузки эмулятора. Если подключено
несколько устройств, сначала задайте `export ANDROID_SERIAL=emulator-5554`
(подставьте serial из `adb devices`).

### 4. Собрать и запустить приложение

```bash
adb reverse tcp:8081 tcp:8081
npm run android -- --device emulator-5554
```

Подставьте serial своего эмулятора. Команда собирает debug APK,
устанавливает его и запускает Metro. Открывается **React Native AFACI** с
пакетом `kg.afaci.afaci_mobile.dev`.

Для последующих запусков без изменений нативных зависимостей:

```bash
npm start -- --localhost
```

В другом подготовленном терминале:

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW \
  -d 'afaci://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081' \
  -p kg.afaci.afaci_mobile.dev
```

Не запускайте второй Metro на том же порту. После установки новых нативных
зависимостей повторите `npm run android`. Если root недоступен, проверьте
образ AVD; если hosts не записывается — перезапустите эмулятор с
`-writable-system`. При ошибке сети проверьте dev-стенд, ping и повторите
`dev-emulator.sh`, затем перезапустите приложение.

## Скрипты

| Скрипт                      | Что делает                               |
| --------------------------- | ---------------------------------------- |
| `npm run android`           | сборка debug APK и установка на эмулятор |
| `npm start`                 | Metro                                    |
| `npm run lint`              | ESLint                                   |
| `npm run typecheck`         | `tsc --noEmit`                           |
| `npm run format`            | Prettier                                 |
| `npm run format:check`      | Prettier в режиме проверки               |
| `npm run api:types`         | генерация типов из OpenAPI dev-стенда    |
| `./scripts/dev-emulator.sh` | hosts и CA dev-стенда в эмуляторе        |

`api:types` по умолчанию берёт `https://api.foodcraftsl.lab/openapi.json` и
подключает корневой CA Caddy через `NODE_EXTRA_CA_CERTS` из
`assets/certs/caddy_root.pem`. Свой адрес — `OPENAPI_URL=...`.

## Проверки

```bash
eval "$(fnm env)"
fnm use 22
npm run lint
npm run typecheck
npm run format:check
npx expo-doctor
```

Android debug APK собирается с JDK 17:

```bash
cd android && ./gradlew :app:assembleDebug
```

## Структура

```text
afaci_mobile/
  app/                     # expo-router
    (auth)/login.tsx       # вход
    (tabs)/                # главная, база, калькулятор, рецептуры, профиль
    admin/                 # админка (пока заглушка дашборда)
  src/
    modules/               # фичевые модули (home, catalog, products, …)
    shared/
      api/                 # клиент, модели, типы OpenAPI
      session/             # Zustand-сессия, токен, права, редиректы
      lib/                 # форматирование ru-RU, сом, cn
      theme/               # цвета для API навигации
      ui/                  # gluestack-ui + kit (Screen, Card, Button, …)
    global.css             # семантические токены (светлая/тёмная тема)
  plugins/                 # Expo config plugins
  scripts/                 # dev-emulator.sh
  android/                 # prebuild, коммитится
  assets/
    images/                # иконки и splash приложения
    certs/                 # корневой CA dev-стенда
  app.config.ts
```

Сессия хранится в `expo-secure-store`, серверные данные — в TanStack Query,
локальное состояние — в Zustand. UI использует gluestack-ui v5 и NativeWind v5.
Формулы Липатова и конвертация единиц выполняются только на backend через
`/compute`. Самостоятельной регистрации в приложении нет — инвайт-модель.

## Сессия и навигация

- Токен — `expo-secure-store` (ключ `afaci_token`), в памяти дублируется для
  синхронного доступа из API-клиента.
- `GET /api/v1/auth/me` при старте восстанавливает сессию; недействительный
  токен стирается, приложение открывается как гость.
- Сетевая ошибка или 5xx при восстановлении сохраняет токен и показывает
  кнопку повтора. Если SecureStore не смог удалить токен при выходе, повтор
  сначала завершает удаление; старый вход не восстанавливается.
- 401 на запросе с токеном → разлогин и `queryClient.clear()`.
- Обычный 403 показывает ошибку прав, сохраняя сессию; 403 от `/auth/me`
  закрывает недоступную сессию.
- Главная, «О нас» и база открыты гостям. Калькулятор, рецептуры, профиль и
  админка требуют входа: гость переходит на `/login?next=...`. После входа
  `next` проверяется по белому списку (`src/shared/session/next-route.ts`).
- Авторизованный пользователь не остаётся на `/login`. Logout очищает кэш;
  запоздалые ответы старой сессии не меняют новую.

## Готовность

Реализованы вход, восстановление сессии, выход, навигация и защищённые
маршруты (этап 1), главная, «О нас» и база продуктов с поиском, фильтрами,
пагинацией и составом (этап 2). Калькулятор, рецептуры и админка пока
содержат заглушки — этапы 3–6 плана. Нативные задачи (установка обновлений,
release-подпись) — этап 7.

## Ручная проверка этапа 1

1. Без входа открыть главную и базу; открыть калькулятор и рецептуры —
   должна появиться форма входа.
2. Проверить пустую форму, неверный email, показ/скрытие пароля и ошибку
   неверного пароля. Регистрации в интерфейсе нет.
3. Войти существующей учётной записью; после входа открывается запрошенный
   защищённый раздел. Внешний URL в `next` игнорируется.
4. Перезапустить приложение — вход восстанавливается. Открыть `/login` —
   приложение перенаправляет в защищённый раздел.
5. В профиле подтвердить выход; после перезапуска приложение остаётся
   гостевым. Повторный вход другим пользователем не показывает старые данные.
6. При недоступном сервере во время восстановления появляется ошибка с
   повтором; после восстановления сети повтор возвращает сессию.

## Ручная проверка этапа 2

1. Открыть главную: hero, инструменты, возможности и кнопки перехода.
   У гостя защищённые инструменты отмечены бейджем «Требуется вход».
   Ссылка «О нас» открывает заглушку «В будущих релизах».
2. В базе найти `Баранина`, `баранина`, `БАРАНИНА`: результаты одинаковые.
   Проверить категорию, зависимую подкатегорию и регион, затем сбросить
   фильтры. Подписи выбора должны сброситься вместе со значениями.
3. Прокрутить список для подгрузки, потянуть вниз для обновления.
   Открыть карточку продукта и вернуться системной кнопкой Back.
4. В карточке проверить названия, группы нутриентов по типу и единице,
   диаграмму БЖУ. Значения и единицы берутся из API без конвертации;
   отсутствующее значение отличается от нуля. При разных единицах
   диаграмма не смешивает значения.
5. Проверить пустой поиск, недоступную сеть и повтор загрузки. Проверить
   светлую и тёмную темы, увеличенный шрифт, клавиатуру и Back в фильтрах.

Для диаграмм используются `react-native-gifted-charts` и
`expo-linear-gradient`; после обновления зависимостей нужна новая Android
debug-сборка.

Для кириллического поиска и стабильной пагинации backend должен включать
исправления из `fix/mobile-catalog-search-pagination`; подробности —
в [ERROR.md, раздел 11](../ERROR.md#11-каталог--кириллический-поиск-и-пропуски-при-пагинации).

## Android-конфигурация

- `applicationId`: `kg.afaci.afaci_mobile`, debug — `.dev` (config plugin
  `plugins/with-debug-application-id-suffix.js`). Debug- и release-сборки
  могут быть установлены одновременно.
- `versionCode 2`, `versionName 2.0.0`.
- Разрешения: `INTERNET`; overlay и legacy-storage заблокированы в `app.config.ts`.
- `android/` пересоздаётся через `npx expo prebuild --platform android --clean`;
  ручные правки нативных файлов должны переноситься в config plugins.
- Release-подпись и поток обновления APK ещё не настроены — этап 7 плана.

## Dev-стенд из эмулятора

Схема из [`ERROR.md`, п. 10](../ERROR.md): эмулятор не видит хостовый
`/etc/hosts`, а сертификат dev-стенда подписан локальным CA Caddy.
Всё делает `./scripts/dev-emulator.sh`:

1. `adb root` и `adb remount`;
2. `10.0.2.2 api.foodcraftsl.lab` в `/system/etc/hosts`;
3. корневой CA Caddy в системный store. На Android 14+ (API 34+) store
   переехал в APEX, поэтому `tmpfs` монтируется поверх
   `/apex/com.android.conscrypt/cacerts` — живёт до перезагрузки.

OkHttp (на нём работает `fetch` в RN) не доверяет пользовательским
сертификатам и не читает `network-security-config` в debug-сборке, поэтому
debug-конфиг намеренно не используется.
