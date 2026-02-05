# Настройка Supabase MCP Server для Cursor

## Текущий статус

После настройки Supabase MCP сервер позволяет AI в Cursor работать с вашим Supabase проектом.

### Не коммитьте project_ref в репозиторий

В `.cursor/mcp.json` в репозитории указан плейсхолдер `YOUR_PROJECT_REF`. Реальный URL с вашим `project_ref` настраивайте локально:

- **Локальный конфиг:** скопируйте `.cursor/mcp.example` в `.cursor/mcp.local.json`, подставьте свой Project Reference. Файл `mcp.local.json` в `.gitignore`.
- **Глобальный Cursor:** добавьте блок `supabase` с вашим URL в Cursor Settings → MCP или в `~/.cursor/mcp.json`.

Подробнее: [.cursor/README.md](.cursor/README.md).

### Обнаруженные таблицы в базе данных (пример)

MCP сервер успешно подключен к вашей базе данных. Обнаружены следующие таблицы:

1. **`places`** (1 запись)
   - `id` (bigint, primary key)
   - `created_at` (timestamptz)
   - `name` (varchar, nullable)
   - RLS включен

2. **`items`** (0 записей)
   - `id` (bigint, primary key)
   - `created_at` (timestamptz)
   - Связана с `transitions` через foreign key

3. **`containers`** (0 записей)
   - `id` (bigint, primary key)
   - `created_at` (timestamptz)
   - `name` (varchar, nullable)
   - RLS включен

4. **`transitions`** (0 записей)
   - `id` (bigint, primary key)
   - `created_at` (timestamptz)
   - `item_id` (bigint, nullable, FK → items.id)
   - `destination_type` (varchar, nullable)
   - `destination_id` (bigint, nullable)
   - RLS включен

## Что такое Supabase MCP?

Supabase MCP (Model Context Protocol) сервер позволяет AI-ассистентам (например, в Cursor) напрямую взаимодействовать с вашим Supabase проектом:
- Запросы к базе данных
- Управление схемой
- Выполнение операций через инструменты MCP

## Настройка Supabase MCP Server

### Вариант 1: Использование официального hosted сервера (рекомендуется)

1. **Получите Project Reference (project_ref)**
   - Откройте [Supabase Dashboard](https://app.supabase.com/)
   - Выберите ваш проект
   - Project Reference можно найти в URL: `https://app.supabase.com/project/[project-ref]`
   - Или в Settings -> General -> Reference ID

2. **Настройте MCP сервер в Cursor**
   - Откройте **Cursor Settings** → **MCP / Tools & MCP**
   - Добавьте новый MCP сервер с конфигурацией:

   **Для Windows (PowerShell):**
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "cmd",
         "args": [
           "/c",
           "npx",
           "-y",
           "@supabase/mcp-server",
           "--project-ref",
           "YOUR_PROJECT_REF"
         ]
       }
     }
   }
   ```

   **Для macOS/Linux:**
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": [
           "-y",
           "@supabase/mcp-server",
           "--project-ref",
           "YOUR_PROJECT_REF_HERE"
         ]
       }
     }
   }
   ```

   **Или используйте HTTP endpoint (шаблон в проекте: `.cursor/mcp.example`):**
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
   Подставьте свой Project Reference; не коммитьте этот URL в репозиторий — используйте локальный конфиг или глобальный Cursor MCP.

3. **Аутентификация**

   **Вариант A: OAuth (рекомендуется)**
   - При первом использовании MCP сервер откроет браузер для OAuth авторизации
   - Войдите в свой Supabase аккаунт
   - Разрешите доступ

   **Вариант B: Personal Access Token (PAT)**
   - Создайте PAT в Supabase Dashboard: Settings -> Access Tokens
   - Добавьте в переменные окружения или передайте через аргументы:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": [
           "-y",
           "@supabase/mcp-server",
           "--project-ref",
           "YOUR_PROJECT_REF_HERE",
           "--access-token",
           "YOUR_PAT_HERE"
         ]
       }
     }
   }
   ```

### Вариант 2: Self-hosted / Local сервер

Если вы используете локальный Supabase:

1. **Включите MCP endpoint** в `kong.yml` вашего Docker setup
2. **Настройте клиент** для подключения к `http://localhost:8080/mcp`
3. **Используйте PAT** для аутентификации (OAuth может не работать локально)

## Проверка настройки

После настройки MCP сервера:

1. **Перезапустите Cursor**
2. **Проверьте доступные ресурсы** - выполните команду для проверки MCP ресурсов
3. **Попробуйте использовать инструменты** - спросите AI о вашей базе данных

## Общие проблемы и решения

### Проблема: "Loading tools" зависает навсегда

**Причина:** Отсутствует `project_ref` или неправильно настроен URL

**Решение:**
- Убедитесь, что `project_ref` указан в конфигурации
- Проверьте правильность project_ref (можно найти в Supabase Dashboard)
- Для HTTP endpoint используйте формат: `https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF`

### Проблема: Unauthorized или invalid access token

**Причина:** PAT не установлен или передан неправильно

**Решение:**
- Создайте новый PAT в Supabase Dashboard: Settings -> Access Tokens
- Убедитесь, что PAT передается правильно (через аргументы или переменные окружения)
- Или используйте OAuth авторизацию

### Проблема: На Windows команда `npx` не работает

**Причина:** Windows требует `cmd /c` перед командой

**Решение:**
- Используйте конфигурацию с `"command": "cmd"` и `"args": ["/c", "npx", ...]`
- См. пример выше для Windows

### Проблема: SSL или проблемы с подключением

**Причина:** Неправильный URL или проблемы с сетью

**Решение:**
- Убедитесь, что используете правильный URL (`https://` для hosted, `http://` для local)
- Проверьте доступность сервера
- Для self-hosted используйте SSH туннель или локальный loopback

## Дополнительные параметры

### Read-only режим

Для предотвращения изменений данных/схемы:
```
?read_only=true
```

### Ограничение функций

Для включения/отключения групп инструментов:
```
?features=query,schema
```

## Следующие шаги

1. Получите `project_ref` из Supabase Dashboard (Settings → General → Reference ID).
2. Настройте MCP сервер: скопируйте `.cursor/mcp.example` в `.cursor/mcp.local.json` и подставьте свой `project_ref`, либо добавьте конфиг в Cursor Settings → MCP.
3. Настройте аутентификацию (OAuth при первом использовании или PAT).
4. Перезапустите Cursor и проверьте доступность MCP ресурсов.

### После настройки

MCP сервер позволит:
- Запрашивать данные из базы данных через AI
- Управлять схемой базы данных
- Выполнять SQL запросы
- Получать информацию о таблицах, миграциях и расширениях

### Быстрая настройка

Используйте шаблон из репозитория: `.cursor/mcp.example`. Замените `YOUR_PROJECT_REF` на ваш Project Reference. Не коммитьте конфиг с реальным URL — храните его в `.cursor/mcp.local.json` (в .gitignore) или в глобальном Cursor MCP.

**HTTP endpoint:**
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

**NPX (Windows):**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@supabase/mcp-server", "--project-ref", "YOUR_PROJECT_REF"]
    }
  }
}
```

## Полезные ссылки

- [Официальная документация Supabase MCP](https://supabase.com/mcp)
- [Supabase MCP на GitHub](https://github.com/supabase-community/supabase-mcp)
- [MCP Hub - Supabase](https://mcphub.com/mcp-servers/supabase-community/supabase-mcp)
