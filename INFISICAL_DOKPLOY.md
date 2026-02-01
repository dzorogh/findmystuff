# Infisical + Dokploy (Dockerfile)

## Настройка в Dokploy

1. **General → Build Type:** выберите **Dockerfile** (вместо Railpack).
2. Путь к Dockerfile — корень репозитория (`./Dockerfile`).
3. **Environment:** добавьте переменные (нужны **только при запуске** контейнера; сборка образа не использует Infisical):
   - **INFISICAL_PROJECT_ID** (обязательно для запуска) — передаётся в `infisical run --projectId`.
   - **INFISICAL_TOKEN** — access token; либо его, либо **INFISICAL_CLIENT_ID** + **INFISICAL_CLIENT_SECRET** (Machine Identity).
   - **INFISICAL_SITE_URL**, **INFISICAL_ENVIRONMENT** — если используете в Dokploy.
   - **INFISICAL_API_URL** — только для self-hosted Infisical.
   - **PORT** — при необходимости (Next.js читает порт из env).

Сборка образа выполняется без Infisical (`npm run build`). Секреты подставляются только при старте контейнера через `infisical run -- node server.js`.

## Получение INFISICAL_TOKEN

1. В [Infisical](https://infisical.com): создать [Machine Identity](https://infisical.com/docs/documentation/platform/identities/machine-identities) или Service Token для проекта.
2. Подставить токен в **INFISICAL_TOKEN** в Dokploy Environment.
