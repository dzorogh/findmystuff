import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

/** Тип назначения для переходов и создания сущностей с локацией (API/БД). В transitions допустимы только эти значения. */
export type DestinationType = "room" | "place" | "container" | "furniture";

/** Тип назначения для UI перемещения: DestinationType + "building". В API при создании transition допустимы только DestinationType. */
export type MoveDestinationType = DestinationType | "building";

/** Тип сущности по имени (для отображения, этикеток, списков, имён таблиц API). */
export type EntityTypeName = "item" | "place" | "container" | "room" | "building" | "furniture";

/** Ключ действия в меню сущности. */
export type ActionKey = "edit" | "move" | "printLabel" | "duplicate" | "delete" | "restore";

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
  entity_category: EntityTypeName;
  name: string;
  created_at: string;
  deleted_at: string | null;
}

/** Ссылка на тип сущности (название; из API name может быть null). */
export interface EntityTypeRef {
  name: string | null;
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
  item_type?: EntityTypeRef | null;
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
  entity_type?: EntityTypeRef | null;
  // Дополнительные поля из списков
  room_id?: number | null;
  room_name?: string | null;
  furniture_id?: number | null;
  furniture_name?: string | null;
  /** Данные о комнате (из API списка мест) */
  room?: RoomRef | null;
  items_count?: number;
  containers_count?: number;
}

export interface Container extends BaseEntity {
  entity_type_id: number | null;
  entity_type?: EntityTypeRef | null;
  items_count?: number;
}

export interface Building extends BaseEntity {
  building_type_id?: number | null;
  building_type?: EntityTypeRef | null;
  rooms_count?: number;
}

export interface Room extends BaseEntity {
  room_type_id?: number | null;
  room_type?: EntityTypeRef | null;
  building_id?: number | null;
  building_name?: string | null;
  items_count?: number;
  places_count?: number;
  containers_count?: number;
  furniture_count?: number;
}

/** Ссылка на комнату (id + название). */
export type RoomRef = Pick<Room, "id" | "name">;

export interface Furniture extends BaseEntity {
  room_id: number;
  /** Данные о комнате (нормализованный вид для UI) */
  room?: RoomRef | null;
  furniture_type_id?: number | null;
  furniture_type?: EntityTypeRef | null;
  places_count?: number;
  /** Fowler Money Pattern: стоимость покупки */
  price?: { amount: number; currency: string } | null;
  /** Текущая оценочная стоимость. Fowler Money Pattern. */
  currentValue?: { amount: number; currency: string } | null;
  /** Дата покупки (YYYY-MM-DD) */
  purchaseDate?: string | null;
}

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
interface BaseCreateEntityResponse {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateItemResponse extends BaseCreateEntityResponse {
  item_type_id: number | null;
  photo_url: string | null;
  price?: { amount: number; currency: string } | null;
  currentValue?: { amount: number; currency: string } | null;
  quantity?: number | null;
  purchaseDate?: string | null;
}

export interface CreatePlaceResponse extends BaseCreateEntityResponse {
  entity_type_id: number | null;
  photo_url: string | null;
}

export interface CreateContainerResponse extends BaseCreateEntityResponse {
  entity_type_id: number | null;
  photo_url: string | null;
}

export interface CreateBuildingResponse extends BaseCreateEntityResponse {
  building_type_id: number | null;
  photo_url: string | null;
}

export interface CreateRoomResponse extends BaseCreateEntityResponse {
  room_type_id: number | null;
  photo_url: string | null;
}

export interface CreateFurnitureResponse extends BaseCreateEntityResponse {
  room_id: number;
  furniture_type_id: number | null;
  photo_url: string | null;
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

export interface CreateEntityTypeResponse extends BaseCreateEntityResponse {
  entity_category: EntityTypeName;
}

export interface UpdateEntityTypeResponse extends BaseCreateEntityResponse {
  entity_category: EntityTypeName;
}

// --- Entity action types (menus, buttons) ---

export type ActionVariant = "ghost" | "secondary" | "destructive" | "default";

export interface ActionBase {
  key: ActionKey;
  label: string;
  icon: LucideIcon;
  variant?: ActionVariant;
}

export type Action =
  | (ActionBase & { href: string })
  | (ActionBase & { onClick: () => void })
  | (ActionBase & { Form: ComponentType<Record<string, unknown>>; formProps: Record<string, unknown> });

export interface ActionsContext {
  refreshList: () => void;
  basePath?: string;
  printLabel?: (id: number, name?: string | null) => void | Promise<void>;
  handleDelete?: (id: number) => void;
  handleDuplicate?: (id: number) => void;
  handleRestore?: (id: number) => void;
}

export type ActionConfig =
  | (ActionBase & { getHref: (entity: EntityDisplay) => string })
  | (ActionBase & { getOnClick: (entity: EntityDisplay, ctx: ActionsContext) => () => void })
  | (ActionBase & {
      Form: ComponentType<Record<string, unknown>>;
      getFormProps: (entity: EntityDisplay, ctx: ActionsContext) => Record<string, unknown>;
    });

// --- Entity list/config types ---

export interface Results {
  one: string;
  few: string;
  many: string;
}

export interface Filters {
  showDeleted: boolean;
  [key: string]: unknown;
}

export interface EntityDisplay {
  id: number;
  name: string | null;
  deleted_at?: string | null;
}

export interface EntityLabels {
  singular: string;
  plural: string;
  results: Results;
  moveTitle: string;
  moveSuccess: (destinationName: string) => string;
  moveError: string;
  deleteConfirm?: string;
  deleteSuccess?: string;
  deleteError?: string;
  restoreSuccess?: string;
  restoreError?: string;
  duplicateSuccess?: string;
  duplicateError?: string;
}

export interface MoveConfig {
  enabled: boolean;
  destinationTypes?: MoveDestinationType[];
}

export interface ActionsConfig {
  whenActive: ActionConfig[];
  whenDeleted?: ActionConfig[];
}

export type FilterFieldConfig =
  | { type: "showDeleted"; label: string }
  | { type: "yesNoAll"; key: string; label: string }
  | { type: "locationType"; key: string }
  | { type: "room"; key: string }
  | { type: "building"; key: string }
  | { type: "furniture"; key: string }
  | { type: "entityType"; key: string; entityKind: Extract<EntityTypeName, "place" | "container" | "furniture"> };

export interface ListColumnConfig {
  key: string;
  label: string;
  width?: string;
  hideOnMobile?: boolean;
}

export interface AddFormConfig {
  title: string;
  form: ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
  }>;
}

export interface FetchListParams {
  query?: string;
  filterValues: Filters;
  sortBy: "name" | "created_at";
  sortDirection: "asc" | "desc";
  page?: number;
  tenantId?: number | null;
}

export interface FetchListResult {
  data: EntityDisplay[];
  totalCount?: number;
  error?: string;
}

export interface DefaultSortConfig {
  sortBy: "name" | "created_at";
  sortDirection: "asc" | "desc";
}

export interface PaginationConfig {
  pageSize: number;
}

export interface CountsConfig {
  filterParam: string;
  links: Array<{ path: string; field: string; icon: LucideIcon; label: string }>;
}

export interface ListPagePagination {
  totalCount: number;
  pageSize: number;
  totalPages: number;
  currentPage: number;
  goToPage: (page: number) => void;
}

export interface EntityConfig {
  kind: EntityTypeName;
  basePath: string;
  apiTable: EntityTypeName;
  labels: EntityLabels;
  actions: ActionsConfig;
  move?: MoveConfig;
  addForm?: AddFormConfig;
  getName?: (entity: EntityDisplay) => string;
  icon?: LucideIcon;
  filters: {
    fields: FilterFieldConfig[];
    initial: Filters;
  };
  columns: ListColumnConfig[];
  fetch: (params: FetchListParams) => Promise<FetchListResult>;
  pagination?: PaginationConfig;
  counts?: CountsConfig;
  defaultSort?: DefaultSortConfig;
  groupBy?: (entity: EntityDisplay) => string | null;
  groupByEmptyLabel?: string;
}

// --- Detail payloads (load-place-detail, load-container-detail, load-room-detail, get-places-list, map-items-rpc) ---

export type PlaceDetailData = {
  place: Place;
  transitions: Transition[];
  items: Item[];
  containers: Container[];
};

/** Ошибка загрузки детальной страницы сущности (place/container/room). */
export type LoadDetailError = { error: string; status: number };

export type ContainerDetailData = {
  container: Container;
  transitions: Transition[];
  items: Item[];
};

export type RoomDetailData = {
  room: Room;
  items: Item[];
  places: Place[];
  containers: Container[];
  furniture: Furniture[];
};

/** Строка RPC для списка мест (плоские поля БД). */
export type RpcPlaceRow = Pick<
  Place,
  | "id"
  | "name"
  | "created_at"
  | "deleted_at"
  | "photo_url"
  | "entity_type_id"
  | "room_id"
  | "room_name"
  | "furniture_id"
  | "furniture_name"
> & {
  entity_type_name: string | null;
  items_count: number;
  containers_count: number;
};

/** Строка RPC для списка вещей (плоские поля БД). */
export type ItemsRpcRow = Pick<
  Item,
  "id" | "name" | "created_at" | "deleted_at" | "photo_url" | "item_type_id"
> & {
  item_type_name: string | null;
  quantity: number | null;
  price_amount: number | null;
  price_currency: string | null;
  current_value_amount: number | null;
  current_value_currency: string | null;
  purchase_date: string | null;
  destination_type: string | null;
  destination_id: number | null;
  moved_at: string | null;
  room_name: string | null;
  room_id: number | null;
  total_count?: number;
};

/** Конфиг дефолтных имён типов сущностей по категориям (для seed). */
export type DefaultEntityTypesConfig = Partial<Record<EntityTypeName, string[]>>;
