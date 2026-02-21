-- Covering index for FK rooms_room_type_id_fkey (rooms.room_type_id -> entity_types.id).
-- Improves JOINs and FK constraint checks; recommended for foreign key columns.

create index if not exists idx_rooms_room_type_id on public.rooms (room_type_id);
