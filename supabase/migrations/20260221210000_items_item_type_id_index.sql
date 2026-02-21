-- Covering index for FK items_item_type_id_fkey (items.item_type_id -> entity_types.id).
-- Improves JOINs and FK constraint checks; recommended for foreign key columns.

create index if not exists idx_items_item_type_id on public.items (item_type_id);
