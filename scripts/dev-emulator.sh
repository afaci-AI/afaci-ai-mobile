#!/usr/bin/env bash
#
# Готовит Android-эмулятор к работе с dev-стендом https://api.foodcraftsl.lab.
#
# Схема из ERROR.md, п. 10, адаптированная под RN:
#   1. hosts: api.foodcraftsl.lab → 10.0.2.2 (loopback хоста из эмулятора)
#   2. корневой CA Caddy — в системное хранилище Android. OkHttp, на котором
#      работает fetch в RN, не доверяет пользовательским сертификатам и не
#      читает network-security-config из debug-сборки по умолчанию.
#
# На Android 14+ (API 34+) системный store переехал в APEX, поэтому
# /apex/com.android.conscrypt/cacerts перекрывается tmpfs и заполняется
# копией системных сертификатов + нашим. Такой способ живёт до перезагрузки —
# после ребута эмулятора скрипт нужно запустить снова.
#
# Требования: образ google_apis (userdebug) с доступным `adb root`.
# Использование: scripts/dev-emulator.sh

set -euo pipefail

ADB="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT="${CERT:-$SCRIPT_DIR/../assets/certs/caddy_root.pem}"
HOST="${HOST:-api.foodcraftsl.lab}"
HOST_IP="${HOST_IP:-10.0.2.2}"

if [[ ! -f "$CERT" ]]; then
  echo "Не найден сертификат: $CERT" >&2
  exit 1
fi

echo "→ adb root"
"$ADB" root >/dev/null
"$ADB" wait-for-device

echo "→ hosts: $HOST → $HOST_IP"
"$ADB" remount >/dev/null 2>&1 || true
"$ADB" shell "grep -q '$HOST' /system/etc/hosts || echo '$HOST_IP $HOST' >> /system/etc/hosts"

HASH="$(openssl x509 -inform PEM -subject_hash_old -in "$CERT" | head -1)"
echo "→ CA $HOST (hash $HASH) в системное хранилище"

"$ADB" push "$CERT" "/data/local/tmp/$HASH.0" >/dev/null

SDK="$("$ADB" shell getprop ro.build.version.sdk | tr -d '\r')"

if [[ "$SDK" -ge 34 ]]; then
  cat >/tmp/afaci-install-ca.sh <<EOF
set -e

# Набор сертификатов готовим на обычной ФС: tmpfs из одного mount namespace
# в другом не виден, а исходники нужны в каждом из них.
rm -rf /data/local/tmp/cacerts
mkdir -p /data/local/tmp/cacerts
cp /system/etc/security/cacerts/* /data/local/tmp/cacerts/
cp /data/local/tmp/$HASH.0 /data/local/tmp/cacerts/$HASH.0

cat >/data/local/tmp/afaci-mount-ca.sh <<'INNER'
mount -t tmpfs tmpfs /apex/com.android.conscrypt/cacerts 2>/dev/null
cp /data/local/tmp/cacerts/* /apex/com.android.conscrypt/cacerts/
chown root:root /apex/com.android.conscrypt/cacerts/*
chmod 644 /apex/com.android.conscrypt/cacerts/*
# Без переметки файлы остаются appdomain_tmpfs, и SELinux запрещает
# untrusted_app их читать: рукопожатие падает на «Trust anchor not found».
chcon u:object_r:system_security_cacerts_file:s0 /apex/com.android.conscrypt/cacerts/*
chcon u:object_r:system_security_cacerts_file:s0 /apex/com.android.conscrypt/cacerts
INNER

# Приложения форкаются от zygote и наследуют его mount namespace, а не
# namespace init, поэтому монтировать нужно в каждом из них.
for P in 1 \$(pgrep -f zygote); do
  nsenter -t \$P -m /system/bin/sh /data/local/tmp/afaci-mount-ca.sh
done
EOF
  "$ADB" push /tmp/afaci-install-ca.sh /data/local/tmp/afaci-install-ca.sh >/dev/null
  "$ADB" shell su 0 sh /data/local/tmp/afaci-install-ca.sh
  CA_DIR="/apex/com.android.conscrypt/cacerts"
else
  "$ADB" shell su 0 sh -c \
    "cp /data/local/tmp/$HASH.0 /system/etc/security/cacerts/ && \
     chown root:root /system/etc/security/cacerts/$HASH.0 && \
     chmod 644 /system/etc/security/cacerts/$HASH.0"
  CA_DIR="/system/etc/security/cacerts"
fi

if ! "$ADB" shell "ls $CA_DIR/$HASH.0" >/dev/null 2>&1; then
  echo "Не удалось установить CA в $CA_DIR" >&2
  exit 1
fi

echo "✓ Готово. Перезапустите приложение, чтобы OkHttp пересоздал соединения."
