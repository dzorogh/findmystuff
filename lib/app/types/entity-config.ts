import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { EntityActionsCallbacks } from "@/components/entity-detail/entity-actions";

export type TableName = "items" | "places" | "containers" | "rooms";
export type EntityKind = "item" | "place" | "container" | "room";
export type ActionKey = "edit" | "move" | "printLabel" | "duplicate" | "delete";
export type MoveDestinationType = "room" | "place" | "container";

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
  actions: ActionKey[];
  showRestoreWhenDeleted?: boolean;
  move?: MoveConfig;
}

/** Filter field config for EntityFiltersPanel (discriminated by type). */
export type FilterFieldConfig =
  | { type: "showDeleted"; label: string }
  | { type: "yesNoAll"; key: string; label: string }
  | { type: "locationType"; key: string }
  | { type: "room"; key: string }
  | { type: "entityType"; key: string; entityKind: "place" | "container" };

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

/** Normalized params for list fetch. */
export interface FetchListParams {
  query?: string;
  filterValues: Filters;
  sortBy: "name" | "created_at";
  sortDirection: "asc" | "desc";
  page?: number;
}

/** Result of config.fetch (data + optional totalCount for pagination). */
export interface FetchListResult {
  data: EntityDisplay[];
  totalCount?: number;
}

/** Optional pagination: when present, useListPage manages currentPage and passes page to fetch. */
export interface PaginationConfig {
  pageSize: number;
}

/** Pagination state and handlers returned by useListPage when config.pagination is set. */
export interface ListPagePagination {
  totalCount: number;
  pageSize: number;
  totalPages: number;
  currentPage: number;
  goToPage: (page: number) => void;
}

/** Full config passed to useListPage. */
export interface EntityConfig {
  kind: EntityKind;
  basePath: string;
  apiTable: TableName;
  labels: EntityLabels;
  actions: ActionsConfig;
  useActions: (params: { refreshList: () => void }) => (entity: EntityDisplay) => EntityActionsCallbacks;
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
}
