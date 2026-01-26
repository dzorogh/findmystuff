# ESLint Правила для Архитектуры

## Правило: Запрет прямых запросов к базе данных

Это правило запрещает использование прямых `fetch`-запросов и Supabase запросов вне сервисов и клиентов.

### Разрешенные места

Прямые запросы разрешены только в следующих директориях:

- `lib/` - сервисы и клиенты
- `app/api/` - API routes (серверные endpoints)
- `contexts/` - контексты (для auth и других сервисов)
- `components/auth/` - компоненты аутентификации

### Запрещенные места

Прямые запросы **запрещены** в:

- `app/**/*.{ts,tsx}` (кроме `app/api/`)
- `components/**/*.{ts,tsx}` (кроме `components/auth/`)
- `hooks/**/*.{ts,tsx}` (кроме `hooks/use-entity-types.ts`)

### Что запрещено

1. **Импорт `createClient` из `@/lib/supabase/client`**
   ```typescript
   // ❌ Запрещено
   import { createClient } from "@/lib/supabase/client";
   
   // ✅ Разрешено - используйте API клиент
   import { apiClient } from "@/lib/api-client";
   ```

2. **Прямые `fetch`-запросы**
   ```typescript
   // ❌ Запрещено
   const response = await fetch('/api/items');
   
   // ✅ Разрешено - используйте API клиент
   const response = await apiClient.getItems();
   ```

3. **Прямые Supabase запросы**
   ```typescript
   // ❌ Запрещено
   const supabase = createClient();
   const { data } = await supabase.from("items").select("*");
   
   // ✅ Разрешено - используйте API клиент
   const response = await apiClient.getItems();
   ```

### Исключения

- `app/api/**` - API routes могут использовать Supabase напрямую
- `lib/**` - сервисы и клиенты могут использовать Supabase напрямую
- `contexts/**` - контексты могут использовать Supabase для auth
- `components/auth/**` - auth компоненты могут использовать Supabase для аутентификации

### Как исправить ошибки

Если вы видите ошибку ESLint о прямом запросе:

1. **Для чтения данных**: Используйте методы `apiClient`:
   ```typescript
   // Вместо:
   const supabase = createClient();
   const { data } = await supabase.from("items").select("*");
   
   // Используйте:
   const response = await apiClient.getItems();
   ```

2. **Для создания/обновления**: Используйте методы `apiClient`:
   ```typescript
   // Вместо:
   await supabase.from("items").insert({ name: "Item" });
   
   // Используйте:
   await apiClient.createItem({ name: "Item" });
   ```

3. **Для transitions**: Используйте `apiClient.createTransition()`:
   ```typescript
   // Вместо:
   await supabase.from("transitions").insert({ ... });
   
   // Используйте:
   await apiClient.createTransition({ ... });
   ```

### Проверка правил

Запустите ESLint для проверки:
```bash
npm run lint
```

Или для конкретного файла:
```bash
npx eslint path/to/file.tsx
```
