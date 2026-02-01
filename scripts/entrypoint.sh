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

exec infisical run --projectId "$INFISICAL_PROJECT_ID" -- node server.js
