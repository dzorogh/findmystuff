/**
 * Shared types for list page config (filterConfig, columnsConfig, actionsConfig, moveFormConfig).
 * Used by useListPage and list-config per entity.
 */

import type { LucideIcon } from "lucide-react";

/** Normalized params for list fetch (used by useListPage when calling config.fetchList) */
export interface FetchListParams<TFilters = Record<string, unknown>> {
  query?: string;
  filters: TFilters;
  sortBy: "name" | "created_at";
  sortDirection: "asc" | "desc";
  page?: number;
}

/** Result of config.fetchList (data + optional totalCount for pagination) */
export interface FetchListResult {
  data: unknown[];
  totalCount?: number;
}

export interface ListColumnConfig {
  key: string;
  label: string;
  width?: string;
  hideOnMobile?: boolean;
}

export type ListActionKey = "edit" | "move" | "printLabel" | "duplicate" | "delete";

export interface ListActionsConfig {
  actions: ListActionKey[];
  showRestoreWhenDeleted?: boolean;
}

export type MoveFormDestinationType = "room" | "place" | "container";

export interface ListMoveFormConfig {
  enabled: boolean;
  destinationTypes?: MoveFormDestinationType[];
}

/** Filter field config for EntityFiltersPanel (discriminated by type) */
export type FilterFieldConfig =
  | { type: "showDeleted"; label: string }
  | { type: "yesNoAll"; key: string; label: string }
  | { type: "locationType"; key: string }
  | { type: "room"; key: string }
  | { type: "entityType"; key: string; entityKind: "place" | "container" };

export interface ListConfig<
  TFilters extends { showDeleted: boolean },
  TColumnKey extends string = string
> {
  filterConfig: FilterFieldConfig[];
  columnsConfig: Array<ListColumnConfig & { key: TColumnKey }>;
  actionsConfig: ListActionsConfig;
  moveFormConfig: ListMoveFormConfig;
  resultsLabel: { one: string; few: string; many: string };
  initialFilters: TFilters;
  /** Иконка для строк списка (колонка «Название»). */
  listIcon?: LucideIcon;
  /** Форматирование отображаемого имени строки (колонка «Название»). */
  getListDisplayName?: (entity: { id: number; name: string | null }) => string;
}

/** Optional pagination: when present, useListPage manages currentPage and passes page to fetchList */
export interface ListPaginationConfig {
  pageSize: number;
}

/** Optional add dialog: when present, useListPage manages isAddDialogOpen and handlers (no URL sync) */
export type ListAddDialogConfig = boolean | object;

/**
 * Full config passed to useListPage. Extends ListConfig with fetchList and optional pagination/addDialog.
 * getRowActions is NOT part of this config — the page gets it from entity-specific behavior hooks.
 */
export interface ListPageConfig<
  TFilters extends { showDeleted: boolean } = { showDeleted: boolean },
  TColumnKey extends string = string
> extends ListConfig<TFilters, TColumnKey> {
  fetchList: (params: FetchListParams<TFilters>) => Promise<FetchListResult>;
  pagination?: ListPaginationConfig;
  addDialog?: ListAddDialogConfig;
}
