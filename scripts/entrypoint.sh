#!/bin/sh
set -e

if [ -z "$INFISICAL_PROJECT_ID" ]; then
  echo "ERROR: INFISICAL_PROJECT_ID не задан. Добавьте переменную в Dokploy Environment." >&2
  exit 1
fi

if [ -z "$INFISICAL_MACHINE_CLIENT_ID" ] || [ -z "$INFISICAL_MACHINE_CLIENT_SECRET" ]; then
  echo "ERROR: нет machine identity. Укажите INFISICAL_MACHINE_CLIENT_ID и INFISICAL_MACHINE_CLIENT_SECRET." >&2
  exit 1
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

INFISICAL_TOKEN="$(infisical login --method=universal-auth --client-id="$INFISICAL_MACHINE_CLIENT_ID" --client-secret="$INFISICAL_MACHINE_CLIENT_SECRET" --plain --silent)"
if [ -z "$INFISICAL_TOKEN" ]; then
  echo "ERROR: не удалось получить INFISICAL_TOKEN через universal-auth." >&2
  exit 1
fi

if [ -n "$INFISICAL_SECRET_ENV" ]; then
  exec infisical run --token "$INFISICAL_TOKEN" --projectId "$INFISICAL_PROJECT_ID" --env "$INFISICAL_SECRET_ENV" --domain "$INFISICAL_API_URL" -- node server.js
fi

exec infisical run --token "$INFISICAL_TOKEN" --projectId "$INFISICAL_PROJECT_ID" --domain "$INFISICAL_API_URL" -- node server.js
