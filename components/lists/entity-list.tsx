"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityListToolbar } from "@/components/lists/entity-list-toolbar";
import { ListFiltersSheet } from "@/components/lists/list-filters-sheet";
import { ListShell } from "@/components/lists/list-shell";
import { EntityListSkeleton } from "@/components/lists/entity-list-skeleton";
import { EntityRow, getRoomLabel, ROOM_EMPTY_LABEL } from "@/components/lists/entity-row";
import { EntityFiltersPanel } from "@/components/filters/entity-filters-panel";
import type { ListColumnConfig, ListActionsConfig } from "@/lib/app/types/list-config";
import type { FilterFieldConfig } from "@/lib/app/types/list-config";
import type { EntitySortOption } from "@/lib/entities/helpers/sort";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import type { Item, Room, Place, Container } from "@/types/entity";

export interface EntityListProps<T extends { showDeleted: boolean }> {
  data: unknown[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sort: EntitySortOption;
  onSortChange: (sort: EntitySortOption) => void;
  filters: T;
  onFiltersChange: (filters: T) => void;
  isFiltersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  activeFiltersCount: number;
  resultsCount: number;
  resultsLabel: { one: string; few: string; many: string };
  filterConfig: FilterFieldConfig[];
  columnsConfig: ListColumnConfig[];
  actionsConfig: ListActionsConfig;
  listIcon?: React.ComponentType<{ className?: string }>;
  getListDisplayName?: (entity: { id: number; name: string | null }) => string;
  getRowActions: (
    entity: Item | Room | Place | Container
  ) => EntityActionsCallbacks;
}

/** Подпись помещения для строки: только у сущностей с last_location (items). */
function getRoomLabelForRow(entity: unknown): string | undefined {
  const loc = (entity as Item).last_location;
  if (!loc) return undefined;
  return getRoomLabel(loc) ?? ROOM_EMPTY_LABEL;
}

export function EntityList<T extends { showDeleted: boolean }>({
  data,
  isLoading,
  error,
  searchQuery,
  onSearchChange,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  isFiltersOpen,
  onFiltersOpenChange,
  activeFiltersCount,
  resultsCount,
  resultsLabel,
  filterConfig,
  columnsConfig,
  actionsConfig,
  listIcon,
  getListDisplayName,
  getRowActions,
}: EntityListProps<T>) {
  const list = Array.isArray(data) ? data : [];
  const isEmpty = !isLoading && list.length === 0;
  const emptyTitle =
    resultsCount === 0
      ? `По вашему запросу ничего не найдено`
      : `${resultsLabel.many} не найдены`;

  return (
    <div className="flex flex-col gap-2">
      <EntityListToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        sort={sort}
        onSortChange={onSortChange}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={() => onFiltersOpenChange(true)}
      />

      {isLoading ? (
        <EntityListSkeleton columnsConfig={columnsConfig} />
      ) : (
        <ListShell
          error={error}
          isEmpty={isEmpty}
          emptyTitle={emptyTitle}
        >
          <div className="border rounded-md">
            <div className="overflow-x-hidden md:overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnsConfig.map((col) => (
                      <TableHead
                        key={col.key}
                        className={`${col.width ?? ""} ${col.hideOnMobile ? "hidden sm:table-cell" : ""
                          } whitespace-nowrap overflow-hidden text-ellipsis ${col.key === "actions" ? "text-right" : ""
                          }`}
                      >
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((entity) => {
                    const row = entity as Item | Room | Place | Container;
                    const rowActions = getRowActions(row);
                    const roomLabel = getRoomLabelForRow(row);
                    return (
                      <EntityRow
                        key={row.id}
                        entity={row}
                        columnsConfig={columnsConfig}
                        actionsConfig={actionsConfig}
                        listIcon={listIcon}
                        getListDisplayName={getListDisplayName}
                        actionCallbacks={rowActions}
                        roomLabel={roomLabel}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </ListShell>
      )}

      <ListFiltersSheet
        open={isFiltersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Фильтры"
        activeFiltersCount={activeFiltersCount}
      >
        <EntityFiltersPanel
          filterConfig={filterConfig}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </ListFiltersSheet>
    </div>
  );
}
