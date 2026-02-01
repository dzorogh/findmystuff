# Infisical + Dokploy (Dockerfile)

## Настройка в Dokploy

1. **General → Build Type:** выберите **Dockerfile** (вместо Railpack).
2. Путь к Dockerfile — корень репозитория (`./Dockerfile`).
3. **Environment:** добавьте переменные:
   - **INFISICAL_TOKEN** (обязательно) — access token Machine Identity или Service Token.
   - **INFISICAL_PROJECT_ID** — ID проекта в Infisical (нужен, т.к. `.infisical.json` не попадает в образ).
   - **INFISICAL_ENV** — имя окружения (например, `prod`), если не default.
   - **INFISICAL_API_URL** — только для self-hosted Infisical.
   - **PORT** — при необходимости (Next.js читает порт из env).

Секреты приложения (Better Auth, Supabase, Google и т.д.) хранятся в Infisical; в Dokploy дублировать их не нужно.

## Получение INFISICAL_TOKEN

1. В [Infisical](https://infisical.com): создать [Machine Identity](https://infisical.com/docs/documentation/platform/identities/machine-identities) или Service Token для проекта.
2. Подставить токен в **INFISICAL_TOKEN** в Dokploy Environment.
