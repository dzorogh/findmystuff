# Домашний склад

Веб-приложение для управления домашним складом и быстрого поиска вещей. Иерархия: **Помещения → Места → Контейнеры → Вещи**.

## Возможности

- Иерархическая организация: помещения, места, контейнеры, вещи
- Единый поиск по всем сущностям
- Перемещение вещей и контейнеров между уровнями
- Мягкое удаление с восстановлением
- UI на ShadCN + Tailwind CSS

## Стек

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, ShadCN UI
- **Backend:** Supabase (PostgreSQL, Auth, RLS), Google OAuth 2.0
- **Инструменты:** ESLint, pnpm

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

### Структура данных

- **rooms** — помещения  
- **places** — места (привязка к помещению через `transitions`)  
- **containers** — контейнеры  
- **items** — вещи  
- **transitions** — история перемещений; текущее местоположение = последняя запись по `created_at`.

У сущностей есть `deleted_at` (мягкое удаление). Включён RLS.

### Правила ESLint

Прямые запросы к БД и импорт `createClient` из `@/lib/supabase/client` разрешены только в:

- `lib/`, `app/api/`, `contexts/`, `components/auth/`

В страницах, остальных компонентах и хуках используйте **API-клиент** (`apiClient`), а не прямые вызовы Supabase/fetch. Проверка: `npm run lint`.

---

## Сборка и запуск

```bash
npm build
npm start
```

Миграции и RLS настраиваются в Supabase (SQL Editor или MCP).
