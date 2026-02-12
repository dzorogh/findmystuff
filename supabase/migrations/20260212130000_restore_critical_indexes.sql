-- Восстановление индексов по анализу pg_stat_statements.
-- Запросы transitions (item_id, container_id, destination_type+place_id), settings, entity_types
-- потребляют >20% времени — эти индексы критичны.

-- Settings: WHERE (user_id = $1 OR user_id IS NULL) ORDER BY category, key (6.45% + 1.83%)
create index if not exists idx_settings_user_id on public.settings(user_id);
create index if not exists idx_settings_user_id_category on public.settings(user_id, category);

-- Entity types: WHERE deleted_at IS NULL AND entity_category = $1 (5.65%)
create index if not exists idx_entity_types_category on public.entity_types(entity_category)
  where deleted_at is null;

-- Transitions: item_id = ANY($1) ORDER BY created_at DESC (6.63%) — idx_transitions_item_id_created_at уже есть
-- Transitions: container_id = ANY($1) ORDER BY created_at DESC (4%) — idx_transitions_container_id_created_at уже есть

-- Transitions: destination_type = $1 AND place_id = ANY($2) (1.75%)
create index if not exists idx_transitions_destination_type_place_id on public.transitions(destination_type, place_id)
  where destination_type = 'room' and place_id is not null;
