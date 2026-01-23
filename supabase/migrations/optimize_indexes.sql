-- Оптимизация индексов для улучшения производительности запросов
-- Создано на основе анализа частых запросов в приложении

-- ============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ items
-- ============================================

-- Индекс для фильтрации по deleted_at (используется в большинстве запросов)
CREATE INDEX IF NOT EXISTS idx_items_deleted_at 
ON items(deleted_at) 
WHERE deleted_at IS NULL;

-- Индекс для поиска по name (используется с ilike)
CREATE INDEX IF NOT EXISTS idx_items_name_trgm 
ON items USING gin(name gin_trgm_ops);

-- Композитный индекс для сортировки по created_at с фильтром deleted_at
CREATE INDEX IF NOT EXISTS idx_items_created_at_deleted_at 
ON items(created_at DESC, deleted_at) 
WHERE deleted_at IS NULL;

-- Индекс для поиска по name с учетом deleted_at
CREATE INDEX IF NOT EXISTS idx_items_name_deleted_at 
ON items(name, deleted_at) 
WHERE deleted_at IS NULL;

-- ============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ transitions
-- ============================================

-- Индекс для поиска transitions по item_id (часто используется с .in())
CREATE INDEX IF NOT EXISTS idx_transitions_item_id 
ON transitions(item_id) 
WHERE item_id IS NOT NULL;

-- Индекс для поиска transitions по container_id
CREATE INDEX IF NOT EXISTS idx_transitions_container_id 
ON transitions(container_id) 
WHERE container_id IS NOT NULL;

-- Индекс для поиска transitions по place_id
CREATE INDEX IF NOT EXISTS idx_transitions_place_id 
ON transitions(place_id) 
WHERE place_id IS NOT NULL;

-- Композитный индекс для поиска по destination_type и place_id
CREATE INDEX IF NOT EXISTS idx_transitions_destination_type_place_id 
ON transitions(destination_type, place_id) 
WHERE destination_type = 'room' AND place_id IS NOT NULL;

-- Индекс для сортировки по created_at (используется во всех запросах transitions)
CREATE INDEX IF NOT EXISTS idx_transitions_created_at 
ON transitions(created_at DESC);

-- Композитные индексы для частых комбинаций запросов
CREATE INDEX IF NOT EXISTS idx_transitions_item_id_created_at 
ON transitions(item_id, created_at DESC) 
WHERE item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transitions_container_id_created_at 
ON transitions(container_id, created_at DESC) 
WHERE container_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transitions_place_id_destination_type_created_at 
ON transitions(place_id, destination_type, created_at DESC) 
WHERE place_id IS NOT NULL AND destination_type = 'room';

-- ============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ places
-- ============================================

-- Индекс для фильтрации по deleted_at
CREATE INDEX IF NOT EXISTS idx_places_deleted_at 
ON places(deleted_at) 
WHERE deleted_at IS NULL;

-- Индекс для поиска по id (используется с .in())
-- Обычно не нужен, так как id - primary key, но оставляем для полноты

-- ============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ containers
-- ============================================

-- Индекс для фильтрации по deleted_at
CREATE INDEX IF NOT EXISTS idx_containers_deleted_at 
ON containers(deleted_at) 
WHERE deleted_at IS NULL;

-- ============================================
-- ИНДЕКСЫ ДЛЯ ТАБЛИЦЫ rooms
-- ============================================

-- Индекс для фильтрации по deleted_at
CREATE INDEX IF NOT EXISTS idx_rooms_deleted_at 
ON rooms(deleted_at) 
WHERE deleted_at IS NULL;

-- ============================================
-- ВКЛЮЧЕНИЕ РАСШИРЕНИЯ ДЛЯ ТРИГРАММНОГО ПОИСКА
-- ============================================

-- Включаем расширение pg_trgm для полнотекстового поиска (если еще не включено)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- АНАЛИЗ И ОБНОВЛЕНИЕ СТАТИСТИКИ
-- ============================================

-- Обновляем статистику для оптимизатора запросов
ANALYZE items;
ANALYZE transitions;
ANALYZE places;
ANALYZE containers;
ANALYZE rooms;
