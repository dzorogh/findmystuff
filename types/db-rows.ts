/**
 * Типы строк, возвращаемых RPC и запросами к БД в app/api/*.
 * Используются для маппинга в доменные типы (Container, Room и т.д.).
 * При генерации типов из Supabase (supabase gen types) можно заменить на сгенерированные.
 */

/** Строка из get_containers_with_location RPC. */
export interface ContainerRow {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  entity_type_name: string | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  items_count: number;
  destination_type: string | null;
  destination_id: number | null;
  destination_name: string | null;
  moved_at: string | null;
  room_id: number | null;
  room_name: string | null;
  total_count?: number;
}

/** Строка из get_rooms_with_counts RPC. */
export interface RoomRow {
  id: number;
  name: string | null;
  room_type_id: number | null;
  room_type_name: string | null;
  building_id: number | null;
  building_name: string | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  items_count: number;
  places_count: number;
  containers_count: number;
  furniture_count: number;
  total_count?: number;
}
