"use client";

import { Card, CardContent } from "@/components/ui/card";
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
import type { ListEntityType } from "@/components/lists/entity-row";

export interface EntityListProps<T extends { showDeleted: boolean }> {
  entityType: ListEntityType;
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
  resultsLabel: { singular: string; plural: string };
  filterConfig: FilterFieldConfig[];
  columnsConfig: ListColumnConfig[];
  actionsConfig: ListActionsConfig;
  getRowActions: (
    entity: Item | Room | Place | Container
  ) => EntityActionsCallbacks;
}

export function EntityList<T extends { showDeleted: boolean }>({
  entityType,
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
  getRowActions,
}: EntityListProps<T>) {
  const list = Array.isArray(data) ? data : [];
  const isEmpty = !isLoading && list.length === 0;
  const emptyTitle =
    resultsCount === 0
      ? `По вашему запросу ничего не найдено`
      : `${resultsLabel.plural} не найдены`;

  return (
    <div className="space-y-4">
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
                    const roomLabel =
                      entityType === "items"
                        ? getRoomLabel((row as Item).last_location) ??
                        ROOM_EMPTY_LABEL
                        : undefined;
                    return (
                      <EntityRow
                        key={row.id}
                        entityType={entityType}
                        entity={row}
                        columnsConfig={columnsConfig}
                        actionsConfig={actionsConfig}
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
