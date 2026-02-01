-- Разрешить entity_category 'room' и 'item' в entity_types
alter table public.entity_types drop constraint if exists entity_types_entity_category_check;
alter table public.entity_types add constraint entity_types_entity_category_check
  check (entity_category::text = any (array['place'::text, 'container'::text, 'room'::text, 'item'::text]));
