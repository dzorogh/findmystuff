export interface Transition {
  id: number;
  created_at: string;
  destination_type: string | null;
  destination_id: number | null;
  destination_name?: string | null;
  place_name?: string | null;
  room_name?: string | null;
}

export interface Location {
  destination_type: string | null;
  destination_id: number | null;
  destination_name: string | null;
  moved_at: string;
  place_name?: string | null;
  room_name?: string | null;
}

export interface EntityType {
  code: string;
  name: string;
}

export interface BaseEntity {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  last_location?: Location | null;
}

export interface ContainerEntity extends BaseEntity {
  entity_type_id: number | null;
  entity_type?: EntityType | null;
  marking_number: number | null;
}

export interface PlaceEntity extends BaseEntity {
  entity_type_id: number | null;
  entity_type?: EntityType | null;
  marking_number: number | null;
}

export interface ItemEntity extends BaseEntity {}

export interface RoomEntity extends BaseEntity {}
