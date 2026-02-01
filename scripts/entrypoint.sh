#!/bin/sh
set -e

echo "=== ENV (все переменные) ==="
printenv | sort
echo "=== /ENV ==="

if [ -z "$INFISICAL_PROJECT_ID" ]; then
  echo "ERROR: INFISICAL_PROJECT_ID не задан. Добавьте переменную в Dokploy Environment." >&2
  exit 1
fi

if [ -z "$INFISICAL_TOKEN" ] && { [ -z "$INFISICAL_CLIENT_ID" ] || [ -z "$INFISICAL_CLIENT_SECRET" ]; }; then
  echo "ERROR: нет учетных данных Infisical. Укажите INFISICAL_TOKEN или пару INFISICAL_CLIENT_ID + INFISICAL_CLIENT_SECRET." >&2
  exit 1
fi

if [ -n "$INFISICAL_SITE_URL" ]; then
  case "$INFISICAL_SITE_URL" in
    http://*|https://*) ;;
    *)
      echo "ERROR: INFISICAL_SITE_URL должен быть полным URL (http/https). Сейчас: '$INFISICAL_SITE_URL'." >&2
      exit 1
      ;;
  esac
fi

if [ -n "$INFISICAL_API_URL" ]; then
  case "$INFISICAL_API_URL" in
    http://*|https://*) ;;
    *)
      echo "ERROR: INFISICAL_API_URL должен быть полным URL (http/https). Сейчас: '$INFISICAL_API_URL'." >&2
      exit 1
      ;;
  esac
fi

exec infisical run --projectId "$INFISICAL_PROJECT_ID" -- node server.js
