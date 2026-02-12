-- Удаление неиспользуемых индексов (lint: Unused Index)
-- Экономит место и ускоряет INSERT/UPDATE/DELETE

drop index if exists public.idx_settings_user_id_category;
drop index if exists public.idx_settings_key_user_id;
drop index if exists public.idx_settings_global;
drop index if exists public.idx_settings_user_personal;
drop index if exists public.idx_settings_user_id;

drop index if exists public.idx_rooms_room_type_id;
drop index if exists public.idx_rooms_deleted_at;

drop index if exists public.idx_items_item_type_id;
drop index if exists public.idx_items_deleted_at;
drop index if exists public.idx_items_name_deleted_at;
drop index if exists public.idx_items_name_trgm;

drop index if exists public.idx_transitions_item_id;
drop index if exists public.idx_transitions_container_id;
drop index if exists public.idx_transitions_destination_type_place_id;
drop index if exists public.idx_transitions_destination;

drop index if exists public.idx_containers_deleted_at;
drop index if exists public.idx_containers_entity_type_deleted;
drop index if exists public.idx_containers_entity_type_id;

drop index if exists public.idx_places_entity_type_deleted;

drop index if exists public.idx_entity_types_category;
