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
import type {
  EntityDisplay,
  ListColumnConfig,
  ActionsConfig,
  FilterFieldConfig,
  Filters,
  Results,
} from "@/lib/app/types/entity-config";
import type { EntitySortOption } from "@/lib/entities/helpers/sort";
import type { EntityActionsCallbacks } from "@/components/entity-detail/entity-actions";
import type { Item, Room, Place, Container } from "@/types/entity";
import { Card } from "@/components/ui/card";

export interface EntityListProps {
  data: EntityDisplay[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sort: EntitySortOption;
  onSortChange: (sort: EntitySortOption) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isFiltersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  activeFiltersCount: number;
  resultsCount: number;
  results: Results;
  filterFields: FilterFieldConfig[];
  columns: ListColumnConfig[];
  actions: ActionsConfig;
  icon?: React.ComponentType<{ className?: string }>;
  getName?: (entity: { id: number; name: string | null }) => string;
  getRowActions: (entity: EntityDisplay) => EntityActionsCallbacks;
}

/** Подпись помещения для строки: только у сущностей с last_location (items). */
function getRoomLabelForRow(entity: EntityDisplay): string | undefined {
  const loc = (entity as Item).last_location;
  if (!loc) return undefined;
  return getRoomLabel(loc) ?? ROOM_EMPTY_LABEL;
}

export function EntityList({
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
  results,
  filterFields,
  columns,
  actions,
  icon,
  getName,
  getRowActions,
}: EntityListProps) {
  const list = Array.isArray(data) ? data : [];
  const isEmpty = !isLoading && list.length === 0;
  const emptyTitle =
    resultsCount === 0
      ? `По вашему запросу ничего не найдено`
      : `${results.many} не найдены`;

  return (
    <div className="flex flex-col gap-4">
      <EntityListToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        sort={sort}
        onSortChange={onSortChange}
        activeFiltersCount={activeFiltersCount}
        onOpenFilters={() => onFiltersOpenChange(true)}
      />

      <ListShell
        error={error}
        isEmpty={isEmpty}
        emptyTitle={emptyTitle}
      >
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
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
            {isLoading ? (
              <EntityListSkeleton columnsConfig={columns} />
            ) : (
              <TableBody>
                {list.map((entity) => {
                  const row = entity as Item | Room | Place | Container;
                  const rowActions = getRowActions(row);
                  const roomLabel = getRoomLabelForRow(row);
                  return (
                    <EntityRow
                      key={row.id}
                      entity={row}
                      columnsConfig={columns}
                      actions={actions}
                      icon={icon}
                      getName={getName}
                      actionCallbacks={rowActions}
                      roomLabel={roomLabel}
                    />
                  );
                })}
              </TableBody>
            )}

          </Table>
        </Card>
      </ListShell>

      <ListFiltersSheet
        open={isFiltersOpen}
        onOpenChange={onFiltersOpenChange}
        title="Фильтры"
        activeFiltersCount={activeFiltersCount}
      >
        <EntityFiltersPanel
          fields={filterFields}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </ListFiltersSheet>
    </div>
  );
}
