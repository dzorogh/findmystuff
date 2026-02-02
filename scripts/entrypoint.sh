#!/bin/sh
set -e

if [ -z "$INFISICAL_PROJECT_ID" ]; then
  echo "ERROR: INFISICAL_PROJECT_ID не задан." >&2
  exit 1
fi

if [ -z "$INFISICAL_MACHINE_CLIENT_ID" ] || [ -z "$INFISICAL_MACHINE_CLIENT_SECRET" ]; then
  echo "ERROR: нет machine identity. Укажите INFISICAL_MACHINE_CLIENT_ID и INFISICAL_MACHINE_CLIENT_SECRET." >&2
  exit 1
fi

INFISICAL_TOKEN="$(infisical login --method=universal-auth --client-id="$INFISICAL_MACHINE_CLIENT_ID" --client-secret="$INFISICAL_MACHINE_CLIENT_SECRET" --plain --silent)"
if [ -z "$INFISICAL_TOKEN" ]; then
  echo "ERROR: не удалось получить INFISICAL_TOKEN через universal-auth." >&2
  exit 1
fi

set -- infisical run --token "$INFISICAL_TOKEN" --projectId "$INFISICAL_PROJECT_ID"

if [ -n "$INFISICAL_SECRET_ENV" ]; then
  set -- "$@" --env "$INFISICAL_SECRET_ENV"
fi

if [ -n "$INFISICAL_API_URL" ]; then
  set -- "$@" --domain "$INFISICAL_API_URL"
fi

set -- "$@" -- node server.js
exec "$@"
