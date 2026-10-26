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

Команды выполняются из `afaci_mobile`. Нужен AVD **`afaci_rooted` на образе
Google APIs (userdebug)**: образ Google Play не поддерживает `adb root`, без
которого не поставить CA dev-стенда.

Что должно работать одновременно:

| Компонент        | Где                | Как проверить                                                                                 |
| ---------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| dev-стенд API    | хост, Docker       | `curl -s -o /dev/null -w '%{http_code}\n' https://api.foodcraftsl.lab/api/v1/regions` → `200` |
| эмулятор         | отдельный терминал | `adb devices` → `emulator-5554  device`                                                       |
| hosts + CA в нём | `dev-emulator.sh`  | см. [«Дев-стенд не виден из приложения»](#дев-стенд-не-виден-из-приложения)                   |
| Metro            | отдельный терминал | `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8081/status` → `200`               |
| APK установлен   | эмулятор           | `adb shell pm list packages \| grep afaci` → `kg.afaci.afaci_mobile.dev`                      |

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

`fnm` не подключён к shell-профилю, поэтому `eval "$(fnm env)"` нужен в
**каждом** новом терминале — и для Metro, и для сборки.

Если AVD ещё нет, создайте его в Android Studio → Device Manager → Create
Virtual Device: ARM64-образ **Google APIs**, SDK 36, имя `afaci_rooted`.
Проверить: `emulator -list-avds`.

### 2. Запустить root-эмулятор в отдельном терминале

Сначала закройте уже запущенный экземпляр этого AVD, если он стартовал без
`-writable-system`. Данные эмулятора удалять не нужно.

```bash
"$HOME/Library/Android/sdk/emulator/emulator" \
  -avd afaci_rooted -writable-system -no-snapshot
```

Дождитесь рабочего стола Android; оставьте этот терминал открытым.

### 3. Подключить dev-стенд (после каждого старта эмулятора)

```bash
adb wait-for-device
adb root
adb wait-for-device
adb shell id          # ожидается uid=0(root)
./scripts/dev-emulator.sh
adb shell ping -c 1 api.foodcraftsl.lab   # ожидается 10.0.2.2
```

`dev-emulator.sh` прописывает `10.0.2.2 api.foodcraftsl.lab` в
`/system/etc/hosts` и вшивает корневой CA Caddy в системное хранилище
Android — в mount namespace init **и каждого zygote**, с переметкой SELinux
(см. [«Дев-стенд из эмулятора»](#dev-стенд-из-эмулятора)). Всё это живёт
**до перезагрузки эмулятора**, поэтому скрипт повторяется после каждого
старта AVD. Скрипт идемпотентен: лишний запуск безвреден.

Если подключено несколько устройств, сначала
`export ANDROID_SERIAL=emulator-5554` (serial — из `adb devices`).

### 4. Собрать и установить APK

Нужно только при первом запуске и после изменения нативных зависимостей или
конфигурации (`app.config.ts`, `plugins/`, `android/`):

```bash
npm run android -- --device emulator-5554
```

Команда соберёт debug APK и установит его, но **завершится ошибкой**
`No development build (kg.afaci.afaci_mobile) for this project is installed`.
Это ожидаемо, см. [«Сборка падает на “No development
build”»](#сборка-падает-на-no-development-build). APK к этому моменту уже
установлен.

### 5. Запустить Metro и приложение

В подготовленном терминале (Metro занимает его целиком):

```bash
npm start
```

В другом подготовленном терминале:

```bash
npm run android:launch
```

Откроется **React Native AFACI**, пакет `kg.afaci.afaci_mobile.dev`. Debug- и
release-сборки за счёт суффикса `.dev` стоят на устройстве одновременно.

### Быстрый запуск, когда всё уже установлено

```bash
# терминал 1: эмулятор
"$HOME/Library/Android/sdk/emulator/emulator" -avd afaci_rooted -writable-system -no-snapshot

# терминал 2: подготовка + Metro
cd afaci_mobile && eval "$(fnm env)" && fnm use 22
adb wait-for-device && adb root && adb wait-for-device
./scripts/dev-emulator.sh
npm start

# терминал 3: запуск приложения
npm run android:launch
```

Если эмулятор не перезагружался, шаг с `adb root` и `dev-emulator.sh` можно
пропустить — hosts и CA остаются на месте.

## Диагностика

### Экспресс-проверка

Один блок, который отвечает, где именно обрыв:

```bash
cd afaci_mobile
HASH=$(openssl x509 -inform PEM -subject_hash_old -in assets/certs/caddy_root.pem | head -1)
ZPID=$(adb shell ps -A | awk '/zygote64/{print $2; exit}')

echo "API с хоста:  $(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://api.foodcraftsl.lab/api/v1/regions)"
echo "Metro:        $(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:8081/status)"
echo "Устройства:   $(adb devices | sed -n '2p')"
echo "hosts:        $(adb shell grep foodcraftsl /system/etc/hosts)"
echo "CA в zygote:  $(adb shell su 0 nsenter -t "$ZPID" -m ls /apex/com.android.conscrypt/cacerts/$HASH.0)"
echo "Пакет:        $(adb shell pm list packages | grep afaci)"
```

Ошибки самого приложения:

```bash
adb logcat -d -t 500 | grep -E "ReactNativeJS|SSLHandshake|avc: denied"
```

### «Не удалось загрузить данные» / «Нет соединения с сервером»

Это экран приложения при сетевой ошибке. Идти по шагам:

1. **Бэкенд жив?** `curl https://api.foodcraftsl.lab/api/v1/regions` с хоста.
   Если нет — поднять dev-стенд (`docker ps`: контейнер `devops-server`).
2. **Что в логе?**
   `adb logcat -d -t 500 | grep -E "ReactNativeJS|SSLHandshake"`.
   - `SSLHandshakeException ... Trust anchor for certification path not
found` → CA не виден приложению, см. следующий раздел.
   - `Unable to resolve host` → не прописан hosts: `./scripts/dev-emulator.sh`.
   - `401` / разлогин → истёк токен, нужно войти заново.
3. **Перезапустить приложение** после любой правки доверия: OkHttp кэширует
   соединения и TrustManager, на лету ничего не подхватится.
   `adb shell am force-stop kg.afaci.afaci_mobile.dev && npm run android:launch`

### Дев-стенд не виден из приложения

Проверить, что CA лежит в namespace, из которого форкаются приложения, —
именно здесь ломалось (см. [`ERROR.md`, п. 13](../ERROR.md)):

```bash
HASH=$(openssl x509 -inform PEM -subject_hash_old -in assets/certs/caddy_root.pem | head -1)
ZPID=$(adb shell ps -A | awk '/zygote64/{print $2; exit}')
adb shell su 0 nsenter -t "$ZPID" -m ls /apex/com.android.conscrypt/cacerts/$HASH.0
```

Файл должен существовать. Если `No such file` — эмулятор перезагружался,
повторите `./scripts/dev-emulator.sh`. Если файл есть, а рукопожатие всё
равно падает, проверьте отказы SELinux:

```bash
adb logcat -d -b all | grep "avc: denied" | grep cacerts
```

Отказы с `tcontext=u:object_r:appdomain_tmpfs:s0` означают, что сертификаты
не переметили; это делает `dev-emulator.sh` — перезапустите его и приложение.

Если CA перевыпущен на хосте, обновите `assets/certs/caddy_root.pem` (нужен
именно **корневой** CA Caddy — промежуточный он перевыпускает еженедельно) и
снова прогоните скрипт.

### Красный экран `Unable to load script`

Приложение не достучалось до Metro на `10.0.2.2:8081`.

- Metro запущен? `curl http://localhost:8081/status`.
- **Не добавляйте `--localhost` к `npm start`.** С этим флагом Metro слушает
  только IPv6-loopback `[::1]:8081`, а эмулятор ходит на IPv4-loopback хоста
  `10.0.2.2`. `adb reverse tcp:8081 tcp:8081` не нужен.
- Не держите два Metro на одном порту: `lsof -nP -iTCP:8081 -sTCP:LISTEN`.

Если в логе висит `Couldn't connect to packager, will silently retry`, а
экран показывает старые данные — приложение работает на прошлом бандле;
поднимите Metro и перезапустите приложение.

### Сборка падает на «No development build»

```
No development build (kg.afaci.afaci_mobile) for this project is installed
```

Ожидаемое поведение, не поломка. В проекте нет `expo-dev-client`, поэтому
deep link `afaci://expo-development-client/?url=...`, которым Expo CLI
открывает приложение, обрабатывать некому. Плюс у debug-сборки
`applicationId` с суффиксом `.dev` (config plugin
`plugins/with-debug-application-id-suffix.js`), а CLI ищет пакет из
`app.config.ts`, то есть без суффикса. APK уже установлен — запускайте
`npm run android:launch`.

По той же причине `npm start` запускается **без** `--dev-client`.

### `Activity class ... does not exist`

Класс активити — `kg.afaci.afaci_mobile.MainActivity`, а пакет —
`kg.afaci.afaci_mobile.dev`: суффикс есть у applicationId, но не у имени
класса. Готовая команда — `npm run android:launch`. Проверить вручную:

```bash
adb shell cmd package resolve-activity --brief kg.afaci.afaci_mobile.dev | tail -1
```

### `adb root` не даёт root

`adb shell id` показывает `uid=2000(shell)` — AVD создан на образе Google
Play. Пересоздайте его на образе **Google APIs** (userdebug) под именем
`afaci_rooted`.

### Не записывается `/system/etc/hosts`

Эмулятор запущен без `-writable-system`. Закройте его и стартуйте командой
из шага 2.

### Подключено несколько устройств

`adb` ругается `more than one device/emulator`:

```bash
adb devices
export ANDROID_SERIAL=emulator-5554
```

### После перезагрузки эмулятора всё «отвалилось»

Монтирование CA живёт в tmpfs и не переживает ребут. Порядок:
`adb root` → `./scripts/dev-emulator.sh` → перезапуск приложения. Пересборка
APK не нужна.

### После смены зависимостей

Изменились нативные пакеты, `app.config.ts`, `plugins/` или `android/` —
нужна новая сборка: `npm run android -- --device emulator-5554`, затем
`npm run android:launch`. Чистый prebuild:
`npx expo prebuild --platform android --clean`.

## Скрипты

| Скрипт                      | Что делает                                     |
| --------------------------- | ---------------------------------------------- |
| `npm run android`           | сборка debug APK и установка на эмулятор       |
| `npm run android:launch`    | запуск установленного приложения на устройстве |
| `npm start`                 | Metro                                          |
| `npm run lint`              | ESLint                                         |
| `npm run typecheck`         | `tsc --noEmit`                                 |
| `npm run format`            | Prettier                                       |
| `npm run format:check`      | Prettier в режиме проверки                     |
| `npm run api:types`         | генерация типов из OpenAPI dev-стенда          |
| `./scripts/dev-emulator.sh` | hosts и CA dev-стенда в эмуляторе              |

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
пагинацией и составом (этап 2). Калькулятор реализуется в этапе 3; рецептуры и админка пока
содержат заглушки — этапы 4–6 плана. Нативные задачи (установка обновлений,
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

Схема из [`ERROR.md`, п. 10 и 13](../ERROR.md): эмулятор не видит хостовый
`/etc/hosts`, а сертификат dev-стенда подписан локальным CA Caddy.
Всё делает `./scripts/dev-emulator.sh`:

1. `adb root` и `adb remount`;
2. `10.0.2.2 api.foodcraftsl.lab` в `/system/etc/hosts`;
3. корневой CA Caddy в системный store. На Android 14+ (API 34+) store
   переехал в APEX, поэтому `tmpfs` монтируется поверх
   `/apex/com.android.conscrypt/cacerts` — живёт до перезагрузки.

Про третий пункт важны две детали, без которых приложение CA не видит:

- монтировать нужно в mount namespace init **и каждого** zygote
  (`nsenter -t <pid> -m`): приложения форкаются от zygote и наследуют его
  namespace, а не namespace init;
- скопированные в tmpfs файлы получают контекст SELinux `appdomain_tmpfs`,
  и `untrusted_app` запрещено их открывать, поэтому скрипт переметит их в
  `u:object_r:system_security_cacerts_file:s0`.

Обе ошибки дают один и тот же симптом — `SSLHandshakeException: Trust anchor
for certification path not found` при живом бэкенде.

OkHttp (на нём работает `fetch` в RN) не доверяет пользовательским
сертификатам и не читает `network-security-config` в debug-сборке, поэтому
debug-конфиг намеренно не используется.

## Ручная проверка этапа 3

Проверять под существующей учётной записью. Чек-лист описывает требуемую
проверку и не является подтверждением прохождения сценариев.

1. Открыть калькулятор, выбрать эталон, прочитать описание и значения
   аминокислот. Проверить загрузку, ошибку сети и повтор.
2. Добавить ингредиенты через модальный поиск: кириллица, пустой результат,
   подгрузка следующих страниц, закрытие Back и выбор продукта. Проверить
   добавление и удаление строк, ввод массы с десятичной запятой.
3. При сумме 99 или 101 г расчёт и сохранение с показателями недоступны,
   черновик разрешён. При 100 г рассчитать; отрицательные, пустые,
   некорректные значения не должны отправляться.
4. Включить стоимость: 60 г по 200 сом/кг и 40 г по 100 сом/кг дают
   стоимость партии 16 сом. Нулевая цена разрешена, отсутствующая цена
   отличается от нуля.
5. Проверить результат: предупреждения, заключение, массу и продукты,
   макросостав, энергию, аминокислотные скоры и КРАС/БЦ/V/G. Сверить числа
   с ответом `/calculator/compute`.
6. Изменить массу, продукт, цену или эталон после расчёта: прежний результат
   исчезает. Изменить данные во время запроса — запоздалый ответ не должен
   показывать результат для прежнего состава.
7. Сохранить с именем без группы, в существующую и в новую группу;
   сохранить черновик с суммой не 100 г. Открыть сохранённую рецептуру
   в калькуляторе, изменить, пересчитать и обновить; проверить сохранение
   цены именно в `price_per_kg`.
8. Загрузить пример, пересчитать, сбросить. Проверить, что при сбросе
   прежняя рецептура больше не редактируется.
9. В оптимизации задать БЦ/КРАС и границы массы каждого ингредиента,
   проверить диапазоны и суммы границ. После успеха проверить новые массы
   и стоимость; при неразрешимых ограничениях ошибка 422 видна пользователю.
10. Проверить светлую/тёмную темы, увеличенный шрифт, клавиатуру, прокрутку
    результата, закрытие модальных окон и выход из сессии во время запроса.

Управление списком рецептур и ранжирование остаются задачами этапа 4.
Результаты фактической проверки приведены ниже.

### Фактически проверено в этапе 3

На Android-эмуляторе с существующей авторизованной сессией проверен цикл:
загрузка примера → расчёт → сохранение `Stage3-QA` без группы → выбор
сохранённой рецептуры → загрузка → изменение последнего ингредиента с 4 до
3 г → сумма 99 г и недоступная кнопка расчёта → восстановление 4 г →
успешный повторный расчёт. Рецептура `Stage3-QA` осталась в dev-аккаунте.

Модальный поиск показывает реальные продукты из API. Отдельный экран
результата открывается, возврат к рецептуре работает. Для 100 г баранины
с ценой 200 сом/кг интерфейс показывает 20 сом; серверная оптимизация
успешно вернула 20 сом/100 г и отчёт.

Прошли `npm run lint`, `npm run typecheck`, `npm run format:check` и экспорт
Expo для Android. Файлы экспорта созданы в `/tmp`, в репозиторий не добавлены.
`expo-doctor`: 19/20 проверок; остаётся прежнее замечание о синхронизации
конфигурации Prebuild с сохранённым нативным проектом. Этап 3 принят пользователем 2026-10-26; замечание Expo Doctor сохранено
как известная особенность конфигурации Prebuild.

Дополнительно на эмуляторе проверены видимая ошибка невозможной оптимизации
(минимальная БЦ 100 для баранины) и тёмная тема основного экрана калькулятора.
Светлая тема восстановлена. Полная матрица увеличенного шрифта и всех форм
пока не пройдена.
