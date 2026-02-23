export type DestinationType = "room" | "place" | "container" | "furniture";

/** Тип сущности по имени (для отображения, этикеток, поиска). */
export type EntityTypeName = "item" | "place" | "container" | "room" | "building" | "furniture";

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

export type EntityCategory = "place" | "container" | "room" | "item" | "building" | "furniture";

export interface EntityType {
  id: number;
  entity_category: EntityCategory;
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
  item_type_id?: number | null;
  item_type?: { name: string } | null;
  room_id?: number | null;
  room_name?: string | null;
  /** Fowler Money Pattern: amount в минимальных единицах + currency ISO 4217 */
  price?: { amount: number; currency: string } | null;
  /** Текущая оценочная стоимость. Fowler Money Pattern. */
  currentValue?: { amount: number; currency: string } | null;
  /** Количество единиц вещи */
  quantity?: number | null;
  /** Дата покупки (YYYY-MM-DD) */
  purchaseDate?: string | null;
}

export interface Place extends BaseEntity {
  entity_type_id: number | null;
  entity_type?: {
    name: string;
  } | null;
  // Дополнительные поля из списков
  room_id?: number | null;
  room_name?: string | null;
  furniture_id?: number | null;
  furniture_name?: string | null;
  /** Данные о комнате (из API списка мест) */
  room?: { id: number; name: string | null } | null;
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

export interface Building extends BaseEntity {
  building_type_id?: number | null;
  building_type?: { name: string } | null;
  rooms_count?: number;
}

export interface Room extends BaseEntity {
  room_type_id?: number | null;
  room_type?: { name: string } | null;
  building_id?: number | null;
  building_name?: string | null;
  items_count?: number;
  places_count?: number;
  containers_count?: number;
  furniture_count?: number;
}

export interface Furniture extends BaseEntity {
  room_id: number;
  /** Данные о комнате (нормализованный вид для UI) */
  room?: { id: number; name: string | null } | null;
  furniture_type_id?: number | null;
  furniture_type?: { name: string } | null;
  places_count?: number;
  /** Fowler Money Pattern: стоимость покупки */
  price?: { amount: number; currency: string } | null;
  /** Текущая оценочная стоимость. Fowler Money Pattern. */
  currentValue?: { amount: number; currency: string } | null;
  /** Дата покупки (YYYY-MM-DD) */
  purchaseDate?: string | null;
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
  locationType?: "place" | "container" | "room" | "furniture";
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
  item_type_id: number | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
  price?: { amount: number; currency: string } | null;
  currentValue?: { amount: number; currency: string } | null;
  quantity?: number | null;
  purchaseDate?: string | null;
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

export interface CreateBuildingResponse {
  id: number;
  name: string | null;
  building_type_id: number | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateRoomResponse {
  id: number;
  name: string | null;
  room_type_id: number | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateFurnitureResponse {
  id: number;
  name: string | null;
  room_id: number;
  furniture_type_id: number | null;
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
  entity_category: EntityCategory;
  name: string;
  created_at: string;
  deleted_at: string | null;
}

export interface UpdateEntityTypeResponse {
  id: number;
  entity_category: EntityCategory;
  name: string;
  created_at: string;
  deleted_at: string | null;
}
