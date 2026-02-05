# Cursor MCP configuration

В репозитории не хранится проект-специфичный Supabase URL (`project_ref`), чтобы не коммитить секреты.

## Настройка Supabase MCP

1. **Вариант A: Локальный конфиг (рекомендуется)**  
   Скопируйте `mcp.example` в `mcp.local.json` и замените `YOUR_PROJECT_REF` на ваш Project Reference из [Supabase Dashboard](https://app.supabase.com/) (Settings → General → Reference ID).  
   Файл `mcp.local.json` добавлен в `.gitignore` и не попадёт в репозиторий.  
   Если Cursor не подхватывает `mcp.local.json`, добавьте блок `supabase` из него в глобальный конфиг: **Cursor Settings → MCP** или `~/.cursor/mcp.json`.

2. **Вариант B: Переменная окружения**  
   В `.cursor/mcp.json` в репозитории указан плейсхолдер. Подстановка переменных в `mcp.json` в Cursor может не поддерживаться; при наличии переменной `SUPABASE_MCP_URL` можно задать полный URL (например `https://mcp.supabase.com/mcp?project_ref=...`) и при необходимости подставлять его в конфиг вручную или через скрипт.

3. **Вариант C: Правка только у себя**  
   Можно заменить `YOUR_PROJECT_REF` в локальной копии `.cursor/mcp.json` и не коммитить эти изменения.

Подробнее: [SUPABASE_MCP_SETUP.md](../SUPABASE_MCP_SETUP.md).
