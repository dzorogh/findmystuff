# Infisical + Dokploy (Dockerfile)

## Настройка в Dokploy

1. **General → Build Type:** выберите **Dockerfile** (вместо Railpack).
2. Путь к Dockerfile — корень репозитория (`./Dockerfile`).
3. **Environment** (или Build arguments, если разделены): добавьте переменные — они нужны **и при сборке**, и при запуске:
   - **INFISICAL_TOKEN** (обязательно) — access token Machine Identity или Service Token.
   - **INFISICAL_PROJECT_ID** — ID проекта в Infisical (нужен, т.к. `.infisical.json` не попадает в образ).
   - **INFISICAL_ENV** — имя окружения (например, `prod`), если не default.
   - **INFISICAL_API_URL** — только для self-hosted Infisical.
   - **PORT** — при необходимости (Next.js читает порт из env).

В Dockerfile этап сборки запускает `infisical run -- npm run build`, поэтому `next build` получает переменные из Infisical (NEXT_PUBLIC_APP_URL, DATABASE_URL, Google OAuth и т.д.). Убедитесь, что в Dokploy переменные окружения передаются в контекст сборки (часто те же, что и для runtime).

## Получение INFISICAL_TOKEN

1. В [Infisical](https://infisical.com): создать [Machine Identity](https://infisical.com/docs/documentation/platform/identities/machine-identities) или Service Token для проекта.
2. Подставить токен в **INFISICAL_TOKEN** в Dokploy Environment.
