"use client";

import { Fragment, useState, useCallback } from "react";
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
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type {
  Action,
  CountsConfig,
  EntityDisplay,
  EntityTypeName,
  ListColumnConfig,
  FilterFieldConfig,
  Filters,
  Results,
} from "@/types/entity";
import type { EntitySortOption } from "@/lib/entities/helpers/sort";
import type { Item, Room, Place, Container } from "@/types/entity";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  onResetFilters?: () => void;
  isFiltersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  activeFiltersCount: number;
  resultsCount: number;
  results: Results;
  filterFields: FilterFieldConfig[];
  columns: ListColumnConfig[];
  icon?: React.ComponentType<{ className?: string }>;
  kind: EntityTypeName;
  getName?: (entity: { id: number; name: string | null }) => string;
  getRowActions: (entity: EntityDisplay) => Action[];
  counts?: CountsConfig;
  groupBy?: (entity: EntityDisplay) => string | null;
  groupByEmptyLabel?: string;
  /** При наличии — показывается кнопка переименования в строке и диалог переименования. */
  onRename?: (entity: EntityDisplay, newName: string) => Promise<void>;
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
  onResetFilters,
  isFiltersOpen,
  onFiltersOpenChange,
  activeFiltersCount,
  resultsCount,
  results,
  filterFields,
  columns,
  icon,
  kind,
  getName,
  getRowActions,
  counts,
  groupBy,
  groupByEmptyLabel = "Без здания",
  onRename,
}: EntityListProps) {
  const resolvedGetName = getName ?? ((e: EntityDisplay) => getEntityDisplayName(kind, e.id, e.name));
  const list = Array.isArray(data) ? data : [];
  const isEmpty = !isLoading && list.length === 0;

  const [renameState, setRenameState] = useState<{
    entity: EntityDisplay;
    inputValue: string;
  } | null>(null);
  const [renameSubmitting, setRenameSubmitting] = useState(false);

  const handleRenameClick = useCallback(
    (entity: EntityDisplay) => {
      const displayName = resolvedGetName(entity);
      setRenameState({
        entity,
        inputValue: displayName ?? entity.name ?? "",
      });
    },
    [resolvedGetName]
  );

  const handleRenameDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setRenameState(null);
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameState || !onRename) return;
    const trimmed = renameState.inputValue.trim();
    if (!trimmed) {
      toast.error("Введите название");
      return;
    }
    setRenameSubmitting(true);
    try {
      await onRename(renameState.entity, trimmed);
      setRenameState(null);
      toast.success("Название изменено");
    } catch {
      toast.error("Не удалось изменить название");
    } finally {
      setRenameSubmitting(false);
    }
  }, [renameState, onRename]);

  const groupedEntries: Array<{ key: string; entities: EntityDisplay[] }> = groupBy
    ? (() => {
        const groups = new Map<string, EntityDisplay[]>();
        for (const entity of list) {
          const key = groupBy(entity) ?? groupByEmptyLabel;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(entity);
        }
        const result: Array<{ key: string; entities: EntityDisplay[] }> = [];
        for (const [key, entities] of groups) {
          result.push({ key, entities });
        }
        result.sort((a, b) => {
          if (a.key === groupByEmptyLabel) return 1;
          if (b.key === groupByEmptyLabel) return -1;
          return a.key.localeCompare(b.key);
        });
        return result;
      })()
    : [{ key: "", entities: list }];
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
        onResetFilters={onResetFilters}
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
                {groupedEntries.map(({ key: groupKey, entities }, groupIndex) => (
                  <Fragment key={groupBy ? `${groupKey}-${groupIndex}` : "single"}>
                    {groupBy && (
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <td
                          colSpan={columns.length}
                          className="px-4 py-2 font-medium text-sm"
                        >
                          {groupKey}
                        </td>
                      </TableRow>
                    )}
                    {entities.map((entity) => {
                      const row = entity as Item | Room | Place | Container;
                      const rowActions = getRowActions(row);
                      const roomLabel = getRoomLabelForRow(row);
                      return (
                        <EntityRow
                          key={row.id}
                          entity={row}
                          columnsConfig={columns}
                          icon={icon}
                          getName={resolvedGetName}
                          actions={rowActions}
                          roomLabel={roomLabel}
                          counts={counts}
                          onRenameClick={onRename ? handleRenameClick : undefined}
                        />
                      );
                    })}
                  </Fragment>
                ))}
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
        onResetFilters={onResetFilters}
      >
        <EntityFiltersPanel
          fields={filterFields}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </ListFiltersSheet>

      {onRename && (
        <Dialog open={!!renameState} onOpenChange={handleRenameDialogOpenChange}>
          <DialogContent showCloseButton>
            {renameState && (
              <>
                <DialogHeader>
                  <DialogTitle>Переименовать</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2 py-2">
                  <Input
                    value={renameState.inputValue}
                    onChange={(e) =>
                      setRenameState((prev) =>
                        prev ? { ...prev, inputValue: e.target.value } : null
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit();
                    }}
                    placeholder="Название"
                    aria-label="Новое название"
                    disabled={renameSubmitting}
                    autoFocus
                  />
                </div>
                <DialogFooter showCloseButton={false}>
                  <Button
                    variant="outline"
                    onClick={() => setRenameState(null)}
                    disabled={renameSubmitting}
                  >
                    Отмена
                  </Button>
                  <Button onClick={handleRenameSubmit} disabled={renameSubmitting}>
                    Сохранить
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
