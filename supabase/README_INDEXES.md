# Оптимизация индексов базы данных

Этот файл содержит SQL-скрипт для создания индексов, оптимизирующих производительность запросов в приложении.

## Как применить индексы

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла `supabase/migrations/optimize_indexes.sql`
5. Вставьте в SQL Editor и нажмите **Run**

### Вариант 2: Через Supabase CLI

```bash
# Если у вас настроен Supabase CLI локально
supabase db push

# Или примените миграцию напрямую
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/optimize_indexes.sql
```

### Вариант 3: Через MCP (если настроен)

Если у вас настроен Supabase MCP сервер, можно выполнить запросы через него.

## Создаваемые индексы

### Таблица `items`
- `idx_items_deleted_at` - для фильтрации по `deleted_at IS NULL`
- `idx_items_name_trgm` - GIN индекс для полнотекстового поиска по `name` (используется с `ilike`)
- `idx_items_created_at_deleted_at` - композитный индекс для сортировки с фильтром
- `idx_items_name_deleted_at` - композитный индекс для поиска по имени с фильтром

### Таблица `transitions`
- `idx_transitions_item_id` - для поиска по `item_id` (используется с `.in()`)
- `idx_transitions_container_id` - для поиска по `container_id`
- `idx_transitions_place_id` - для поиска по `place_id`
- `idx_transitions_destination_type_place_id` - композитный индекс для запросов с `destination_type = 'room'`
- `idx_transitions_created_at` - для сортировки по `created_at DESC`
- Композитные индексы для частых комбинаций запросов

### Таблицы `places`, `containers`, `rooms`
- Индексы для фильтрации по `deleted_at IS NULL`

## Важные замечания

1. **Расширение pg_trgm**: Скрипт включает расширение `pg_trgm` для полнотекстового поиска. Убедитесь, что оно доступно в вашем проекте.

2. **Частичные индексы**: Большинство индексов создаются с условием `WHERE deleted_at IS NULL`, что делает их более эффективными и занимающими меньше места.

3. **Анализ статистики**: После создания индексов выполняется `ANALYZE` для обновления статистики планировщика запросов.

4. **Производительность**: Индексы могут замедлить операции INSERT/UPDATE/DELETE, но значительно ускорят SELECT запросы.

## Проверка индексов

После применения индексов можно проверить их наличие:

```sql
-- Показать все индексы для таблицы items
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'items';

-- Показать все индексы для таблицы transitions
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'transitions';
```

## Мониторинг производительности

После применения индексов рекомендуется:
1. Мониторить производительность запросов через Supabase Dashboard
2. Проверить использование индексов через `EXPLAIN ANALYZE` для ключевых запросов
3. При необходимости добавить дополнительные индексы на основе реального использования
