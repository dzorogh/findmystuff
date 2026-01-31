export type DestinationType = "room" | "place" | "container";

/** Тип сущности по имени (для отображения, этикеток, поиска). */
export type EntityTypeName = "item" | "place" | "container" | "room";

export interface Transition {
  id: number;
  created_at: string;
  item_id?: number | null;
  container_id?: number | null;
  place_id?: number | null;
  destination_type: DestinationType | null;
  destination_id: number | null;
  destination_name?: string | null;
  place_name?: string | null;
  room_name?: string | null;
}

export interface Location {
  destination_type: DestinationType | null;
  destination_id: number | null;
  destination_name: string | null;
  moved_at: string;
  place_name?: string | null;
  room_name?: string | null;
}

export interface EntityType {
  id: number;
  entity_category: "place" | "container";
  name: string;
  created_at: string;
  deleted_at: string | null;
}

export interface BaseEntity {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  last_location?: Location | null;
}

export interface Item extends BaseEntity {
  // Дополнительные поля из списков
  room_id?: number | null;
  room_name?: string | null;
}

export interface Place extends BaseEntity {
  entity_type_id: number | null;
  entity_type?: {
    name: string;
  } | null;
  // Дополнительные поля из списков
  room_id?: number | null;
  room_name?: string | null;
  items_count?: number;
  containers_count?: number;
}

export interface Container extends BaseEntity {
  entity_type_id: number | null;
  entity_type?: {
    name: string;
  } | null;
  // Дополнительные поля из списков
  location_type?: string | null;
  location_id?: number | null;
  location_name?: string | null;
  itemsCount?: number;
}

export interface Room extends BaseEntity {
  // Дополнительные поля из списков
  items_count?: number;
  places_count?: number;
  containers_count?: number;
}

// Для обратной совместимости
export type ItemEntity = Item;
export type PlaceEntity = Place;
export type ContainerEntity = Container;
export type RoomEntity = Room;

// Типы для поиска
export interface SearchResult {
  id: number;
  name: string | null;
  type: EntityTypeName;
  location?: string | null;
  locationType?: "place" | "container" | "room";
}

// Типы для пользователей
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

// Типы для ответов API
export interface CreateItemResponse {
  id: number;
  name: string | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreatePlaceResponse {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateContainerResponse {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateRoomResponse {
  id: number;
  name: string | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateTransitionResponse {
  id: number;
  created_at: string;
  item_id?: number | null;
  container_id?: number | null;
  place_id?: number | null;
  destination_type: DestinationType | null;
  destination_id: number | null;
}

export interface CreateEntityTypeResponse {
  id: number;
  entity_category: "place" | "container";
  name: string;
  created_at: string;
  deleted_at: string | null;
}

export interface UpdateEntityTypeResponse {
  id: number;
  entity_category: "place" | "container";
  name: string;
  created_at: string;
  deleted_at: string | null;
}
