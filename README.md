# Домашний склад

Веб-приложение для управления домашним складом и быстрого поиска вещей. Иерархия: **Здания → Помещения → Мебель / Места → Контейнеры → Вещи**. Поддержка нескольких складов (тенантов) на одного пользователя.

## Возможности

- Мультитенантность: несколько складов, переключение по cookie
- Иерархия: здания, помещения, мебель, места, контейнеры, вещи
- Единый поиск по всем сущностям
- Перемещение вещей и контейнеров между уровнями
- Мягкое удаление с восстановлением
- UI на ShadCN + Tailwind CSS

## Стек

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, ShadCN UI
- **Backend:** Supabase (PostgreSQL, Auth, RLS), Google OAuth 2.0
- **Инструменты:** ESLint, Jest, Playwright, Infisical

---

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Для разработки с секретами используется Infisical (`infisical run --` уже в скрипте `dev`).

---

## Переменные окружения

Создайте `.env.local` или настройте Infisical:

```env
# Supabase (обязательно)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>

# Серверная логика и чтение materialized views (API routes)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# База данных (при необходимости)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# Определение товара по штрихкоду (опционально)
BARCODES_API_KEY=<ключ API barcodes.olegon.ru>
```

**SUPABASE_SERVICE_ROLE_KEY:** Supabase Dashboard → Settings → API → service_role (секретный). Нужен для чтения materialized views и seed entity_types при создании тенанта.

**DATABASE_URL:** Supabase Dashboard → Settings → Database → Connection string → URI. Спецсимволы в пароле кодируйте (`@` → `%40`, `#` → `%23`, `%` → `%25`).

---

## Тесты

- **Unit:** Jest, покрытие по `lib/`. Пороги: 70% (statements, branches, functions, lines).
  ```bash
  npm run test
  npm run test:coverage
  npm run test:coverage:check
  ```
- **E2E:** Playwright, авторизация через `tests/auth.setup.ts` (логин по email/паролю), состояние в `playwright/.auth/user.json`.
  ```bash
  npm run test:e2e          # с Infisical
  npm run test:e2e:ci      # CI (секреты в env)
  npm run test:e2e:ui
  ```
  Для E2E задайте в env: **USER_EMAIL**, **USER_PASSWORD** — тестовый пользователь с хотя бы одним тенантом и данными (здания, помещения, контейнеры, вещи и т.д.).

**Полная проверка:** `npm run check` (lint + unit coverage + e2e).

---

## Supabase

### Google OAuth

1. **Google Cloud Console:** Credentials → Create Credentials → OAuth client ID → Web application.
2. **Authorized JavaScript origins:** `http://localhost:3000`, `https://<project-ref>.supabase.co`, ваш production URL.
3. **Authorized redirect URIs — только один:**  
   `https://<project-ref>.supabase.co/auth/v1/callback`  
   (скопируйте из Supabase: Authentication → Providers → Google). Не добавляйте `http://localhost:3000/auth/callback`.
4. **Supabase Dashboard:** Authentication → Providers → Google — вставьте Client ID и Client Secret.

Client ID/Secret задаются в Supabase Dashboard, не в `.env`.

### Безопасность паролей (рекомендация)

В **Authentication → Settings** включите **Leaked password protection**, чтобы отклонять пароли из утёкших баз (HaveIBeenPwned).

### Ошибка redirect_uri_mismatch (400)

В Google Cloud Console в **Authorized redirect URIs** должен быть **только** Supabase callback URL:  
`https://<project-ref>.supabase.co/auth/v1/callback`. Удалите лишние URI, подождите 2–5 минут.

### Редирект на localhost на production

В Supabase: **Settings → API** задайте **Site URL** = production URL. В **Redirect URLs** добавьте `http://localhost:3000/**` и `https://yourdomain.com/**`. На сервере: `NEXT_PUBLIC_APP_URL=https://yourdomain.com`.

---

## Supabase MCP (Cursor)

В Cursor Settings → MCP добавьте сервер (подставьте свой `project-ref`):

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

При первом использовании откроется OAuth. Альтернатива: [Personal Access Token](https://supabase.com/dashboard/account/tokens).

Миграции и RLS настраиваются в Supabase (SQL Editor или MCP). Materialized views (`mv_*`) доступны только service_role; чтение из них в API — через admin-клиент.

---

## Деплой (Infisical + Dokploy)

- **Build type:** Dockerfile, путь `./Dockerfile`.
- **Environment:** `INFISICAL_PROJECT_ID`, `INFISICAL_TOKEN` (или Machine Identity). Секреты подставляются при запуске через `infisical run -- node server.js`.

---

## Архитектура и код

### Структура данных

- **tenants** — склады (мультитенантность); у пользователя может быть несколько через **tenant_memberships**
- **buildings** — здания
- **rooms** — помещения
- **furniture** — мебель (в помещении)
- **places** — места (привязка к помещению через **transitions**)
- **containers** — контейнеры
- **items** — вещи
- **entity_types** — типы сущностей (по тенантам)
- **transitions** — история перемещений; текущее местоположение = последняя запись по `created_at`

У сущностей есть `deleted_at` (мягкое удаление). RLS и политики привязаны к тенанту.

### Клиент и API

- В страницах и компонентах данные запрашиваются через **API routes** (`/api/...`) и клиенты в `lib/*/api` (fetch с `x-tenant-id` или cookie `tenant_id`).
- Прямые запросы к БД и импорт `createClient` из `@/lib/shared/supabase/client` допустимы в `lib/`, `app/api/`, `contexts/`, компонентах авторизации. Проверка: `npm run lint`.

---

## Сборка и запуск

```bash
npm run build
npm run start
```

Локально для разработки с подстановкой секретов: `npm run dev` (уже использует Infisical при наличии).
