#!/bin/sh
set -e

if [ -z "$INFISICAL_PROJECT_ID" ]; then
  echo "ERROR: INFISICAL_PROJECT_ID не задан. Добавьте переменную в Dokploy Environment." >&2
  exit 1
fi

if [ -z "$INFISICAL_TOKEN" ] && { [ -z "$INFISICAL_CLIENT_ID" ] || [ -z "$INFISICAL_CLIENT_SECRET" ]; }; then
  echo "ERROR: нет учетных данных Infisical. Укажите INFISICAL_TOKEN или пару INFISICAL_CLIENT_ID + INFISICAL_CLIENT_SECRET." >&2
  exit 1
fi

if [ -n "$INFISICAL_SITE_URL" ] && ! echo "$INFISICAL_SITE_URL" | rg -q "^https?://"; then
  echo "ERROR: INFISICAL_SITE_URL должен быть полным URL (http/https). Сейчас: '$INFISICAL_SITE_URL'." >&2
  exit 1
fi

if [ -n "$INFISICAL_API_URL" ] && ! echo "$INFISICAL_API_URL" | rg -q "^https?://"; then
  echo "ERROR: INFISICAL_API_URL должен быть полным URL (http/https). Сейчас: '$INFISICAL_API_URL'." >&2
  exit 1
fi

exec infisical run --projectId "$INFISICAL_PROJECT_ID" -- node server.js
