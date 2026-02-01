-- Удалить колонку code из entity_types (не используется для типов room/item)
alter table public.entity_types drop column if exists code;
