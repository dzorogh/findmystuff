# Домашний склад

Веб-приложение для управления домашним складом и быстрого поиска вещей. Иерархия: **Здания → Помещения → Мебель → Места → Контейнеры → Вещи** (места привязаны к мебели, не к помещению напрямую).

## Возможности

- Иерархическая организация: помещения, места, контейнеры, вещи
- Единый поиск по всем сущностям
- Перемещение вещей и контейнеров между уровнями
- Мягкое удаление с восстановлением
- UI на ShadCN + Tailwind CSS

## Стек

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, ShadCN UI
- **Backend:** Supabase (PostgreSQL, Auth, RLS), Google OAuth 2.0
- **Инструменты:** ESLint, npm

---

## Быстрый старт

```bash
npm install
npm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

---

## Переменные окружения

Создайте `.env.local`:

```env
# Supabase (обязательно)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>

# База данных (для серверной логики при необходимости)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# Определение товара по штрихкоду (опционально)
BARCODES_API_KEY=<ключ API barcodes.olegon.ru>
```

**DATABASE_URL:** Supabase Dashboard → Settings → Database → Connection string → вкладка **URI**. Подставьте реальный пароль; специальные символы в пароле кодируйте (`@` → `%40`, `#` → `%23`, `%` → `%25`).

---

## Supabase

### Google OAuth

1. **Google Cloud Console:** Credentials → Create Credentials → OAuth client ID → Web application.
2. **Authorized JavaScript origins:** `http://localhost:3000`, `https://<project-ref>.supabase.co`, ваш production URL.
3. **Authorized redirect URIs — только один:**  
   `https://<project-ref>.supabase.co/auth/v1/callback`  
   (скопируйте точный URL из Supabase: Authentication → Providers → Google).  
   Не добавляйте `http://localhost:3000/auth/callback`.
4. **Supabase Dashboard:** Authentication → Providers → Google — вставьте Client ID и Client Secret.

Client ID/Secret задаются в Supabase Dashboard, не в `.env`.

### Ошибка redirect_uri_mismatch (400)

В Google Cloud Console в **Authorized redirect URIs** должен быть **только** Supabase callback URL:  
`https://<project-ref>.supabase.co/auth/v1/callback`. Удалите локальные и другие redirect URI, сохраните и подождите 2–5 минут.

### Редирект на localhost на production

В Supabase: **Settings → API** задайте **Site URL** = ваш production URL (например `https://yourdomain.com`). В **Redirect URLs** добавьте `http://localhost:3000/**` и `https://yourdomain.com/**`. На сервере задайте `NEXT_PUBLIC_APP_URL=https://yourdomain.com`.

---

## Supabase MCP (Cursor)

В Cursor Settings → MCP добавьте сервер (подставьте свой `project-ref`):

**HTTP (простой вариант):**
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

При первом использовании откроется OAuth. Альтернатива: [Personal Access Token](https://supabase.com/dashboard/account/tokens) в аргументах или env.

---

## Деплой (Infisical + Dokploy)

- **Build type:** Dockerfile, путь `./Dockerfile`.
- **Environment:** задать `INFISICAL_PROJECT_ID`, `INFISICAL_TOKEN` (или Machine Identity: `INFISICAL_CLIENT_ID` + `INFISICAL_CLIENT_SECRET`). Секреты подставляются при запуске контейнера через `infisical run -- node server.js`.

---

## Архитектура и код

### Основные папки

- **`app/`** — маршруты Next.js (App Router), страницы, API (`app/api/`).
- **`lib/`** — доменная логика и общие хелперы: `lib/shared/api/` (auth, parse-id, apiErrorResponse, HTTP_STATUS), `lib/entities/` (конфиги списков сущностей, helpers, services), `lib/rooms/`, `lib/places/`, `lib/containers/` и т.д.
- **`components/`** — переиспользуемые UI-компоненты.
- **`contexts/`** — глобальный контекст тенанта (`tenant-context.tsx`). Контексты приложения — `lib/app/contexts/` (add-item, current-page, quick-move); доменные (users, settings) — в `lib/users/`, `lib/settings/`.
- **`types/`** — глобальные типы сущностей и API (`types/entity.ts`). Типы списков и действий — `lib/app/types/` (`entity-config.ts`, `entity-action.ts`).

### Типы и конфиги сущностей

- **Типы списков сущностей** — `lib/app/types/entity-config.ts` (EntityDisplay, Filters, EntityLabels, ListColumnConfig, FetchListResult и т.д.).
- **Конфиги по сущностям** — `lib/entities/<entity>/entity-config.ts` (например `itemsEntityConfig`, `placesEntityConfig`): колонки, фильтры, fetch, labels, actions. Не путать с файлом типов: один и тот же термин «entity-config» используется для типов (в `lib/app/types/`) и для конфигов (в `lib/entities/`).

### API-маршруты

Типичный поток: **auth → tenant → парсинг параметров → Supabase/бизнес-логика → ответ**.

Общие хелперы в `lib/shared/api/`:

- **`require-auth.ts`** — `requireAuth`, `requireTenant`, `requireAuthAndTenant` (401/400).
- **`parse-id.ts`** — `parseId(params.id, { entityLabel })` для [id]-маршрутов (400 при неверном ID).
- **`parse-optional-int.ts`** — `parseOptionalInt(searchParams.get("..."))` для опциональных query-параметров.
- **`api-error-response.ts`** — `apiErrorResponse(error, { context, defaultMessage })` для catch-блоков (500).
- **`http-status.ts`** — константы `HTTP_STATUS` (UNAUTHORIZED, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR и т.д.).
- **`validate-item-money.ts`**, **`normalize-entity-type-relation.ts`** — валидация и нормализация данных.

Новые маршруты класть в `app/api/<ресурс>/route.ts` или `app/api/<ресурс>/[id]/route.ts`; везде, где нужны user и tenant, использовать `requireAuthAndTenant(request)` и при необходимости `parseId`.

### Списки сущностей и страница детали

- **Список:** конфиг сущности (columns, filters, fetch, actions) → `useListPage` (состояние, URL, загрузка) → `EntityList` / `EntityRow` (рендер). Ключевые файлы: `lib/app/hooks/use-list-page.tsx`, `lib/app/hooks/list-page-url-state.ts`, `components/lists/entity-list.tsx`, `lib/entities/<entity>/entity-config.ts`.
- **Страница детали:** загрузка по id через API, формы редактирования, переходы (transitions). Для длинных GET [id] загрузка вынесена в `lib/<domain>/` (например `lib/rooms/load-room-detail.ts`).

### Иерархия сущностей

Полная иерархия (сверху вниз):

**buildings (здания) → rooms (помещения) → furniture (мебель) → places (места) → containers (контейнеры) → items (вещи).**

Места (places) привязаны к мебели (furniture), а не к помещению (room) напрямую. **transitions** — история перемещений; текущее местоположение вещи/контейнера определяется последней записью по `created_at`.

### Структура данных и мультитенантность

- **Иерархия:** см. подраздел «Иерархия сущностей» выше.
- У сущностей есть `deleted_at` (мягкое удаление). Включён RLS.
- **Мультитенантность:** у сущностей поле `tenant_id`; активный тенант — cookie, на сервере `getActiveTenantId(request.headers)` (`lib/tenants/server`).

### Конвенции

- **Новая сущность:** добавить entity-config в `lib/entities/<entity>/entity-config.ts`, API-функции в `lib/<entity>/api.ts`, миграции в Supabase, при необходимости маршруты в `app/api/<entity>/`.
- **В `lib/entities/`:** **services** — слой между API и UI (загрузка и нормализация данных страницы, например `item-detail.ts`); **helpers** — чистые утилиты и форматирование (display-name, fetch-list, quick-move, sort и т.д.).
- **Тесты:** юнит-тесты — `__tests__/` (Jest), структура зеркалит `lib/`. E2E — `tests/` (Playwright). Подробнее: [CONTRIBUTING.md](CONTRIBUTING.md).

### Правила ESLint

Прямые запросы к БД и импорт `createClient` разрешены только в:

- `lib/*/api.ts`, `lib/shared/api/**`
- `app/api/**`
- `contexts/**`
- `components/auth/**`

В страницах приложения (кроме auth) и в остальных компонентах/хуках используйте **API-клиент** (`apiClient`), а не прямые вызовы Supabase/fetch.

**Страницы auth (`app/(auth)/**`):** допускается прямой вызов `createClient()` и `supabase.auth.*` для входа, регистрации и сброса пароля; эти пути учтены в конфиге ESLint. Проверка: `npm run lint`.

---

## Сборка и запуск

```bash
npm build
npm start
```

Миграции и RLS настраиваются в Supabase (SQL Editor или MCP).
