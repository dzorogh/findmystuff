"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getContainers } from "@/lib/containers/api";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import type { Container } from "@/types/entity";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container as ContainerIcon, Warehouse, Building2, Package, ArrowRightLeft, MoreHorizontal, RotateCcw, Printer, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MoveContainerForm from "@/components/forms/move-container-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListState } from "@/lib/app/hooks/use-list-state";
import { useDebouncedSearch } from "@/lib/app/hooks/use-debounced-search";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorCard } from "@/components/common/error-card";
import { ListActions } from "@/components/common/list-actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ContainersFiltersPanel, type ContainersFilters } from "@/components/filters/containers-filters-panel";
import { toast } from "sonner";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";

interface ContainersListProps {
  refreshTrigger?: number;
  searchQuery?: string;
  showDeleted?: boolean;
  onSearchStateChange?: (state: { isSearching: boolean; resultsCount: number }) => void;
  onFiltersOpenChange?: (open: boolean) => void;
  filtersOpen?: boolean;
  onActiveFiltersCountChange?: (count: number) => void;
}

const ContainersList = ({ refreshTrigger, searchQuery: externalSearchQuery, showDeleted: externalShowDeleted, onSearchStateChange, onFiltersOpenChange, filtersOpen: externalFiltersOpen, onActiveFiltersCountChange }: ContainersListProps = {}) => {
  const [internalShowDeleted, setInternalShowDeleted] = useState(externalShowDeleted || false);
  const [internalFiltersOpen, setInternalFiltersOpen] = useState(false);

  const isFiltersOpen = externalFiltersOpen !== undefined ? externalFiltersOpen : internalFiltersOpen;
  const setIsFiltersOpen = useCallback((open: boolean) => {
    if (externalFiltersOpen === undefined) {
      setInternalFiltersOpen(open);
    }
    onFiltersOpenChange?.(open);
  }, [externalFiltersOpen, onFiltersOpenChange]);

  useEffect(() => {
    if (externalShowDeleted !== undefined) {
      setInternalShowDeleted(externalShowDeleted);
      setFilters((prev) => ({ ...prev, showDeleted: externalShowDeleted }));
    }
  }, [externalShowDeleted]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, showDeleted: internalShowDeleted }));
  }, [internalShowDeleted]);

  const [filters, setFilters] = useState<ContainersFilters>({
    showDeleted: internalShowDeleted,
    entityTypeId: null,
    hasItems: null,
    locationType: null,
  });

  const {
    user,
    isUserLoading,
    isLoading,
    isSearching,
    error,
    searchQuery,
    showDeleted,
    startLoading,
    finishLoading,
    handleError,
  } = useListState({
    externalSearchQuery,
    externalShowDeleted: filters.showDeleted,
    refreshTrigger,
    onSearchStateChange,
  });

  const [containers, setContainers] = useState<Container[]>([]);
  const [movingContainerId, setMovingContainerId] = useState<number | null>(null);
  const [mobileActionsContainerId, setMobileActionsContainerId] = useState<number | null>(null);
  const router = useRouter();

  const isLoadingRef = useRef(false);
  const requestKeyRef = useRef<string>("");

  const loadContainers = async (query?: string, isInitialLoad = false) => {
    if (!user) return;

    // Создаем уникальный ключ для запроса на основе параметров
    const requestKey = `${query || ""}-${showDeleted}-${filters.entityTypeId}-${filters.hasItems}-${filters.locationType}-${filters.showDeleted}`;

    // Проверяем, не выполняется ли уже такой же запрос
    if (isLoadingRef.current && requestKeyRef.current === requestKey) {
      return;
    }

    isLoadingRef.current = true;
    requestKeyRef.current = requestKey;

    startLoading(isInitialLoad);

    try {
      const response = await getContainers({
        query: query?.trim(),
        showDeleted,
      });

      // API возвращает { data: Container[] }
      // request возвращает это напрямую, поэтому response будет { data: Container[] }
      // И response.data будет Container[]
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        setContainers([]);
        finishLoading(isInitialLoad, 0);
        return;
      }

      const containersWithLocation: Container[] = response.data;

      let filteredContainers = containersWithLocation;

      if (filters.entityTypeId !== null) {
        filteredContainers = filteredContainers.filter(
          (c) => c.entity_type_id === filters.entityTypeId
        );
      }

      if (filters.hasItems !== null) {
        filteredContainers = filteredContainers.filter((c) =>
          filters.hasItems ? (c.itemsCount || 0) > 0 : (c.itemsCount || 0) === 0
        );
      }

      if (filters.locationType) {
        filteredContainers = filteredContainers.filter((c) => {
          if (!c.last_location) return false;
          return c.last_location.destination_type === filters.locationType;
        });
      }

      // Проверяем еще раз перед обновлением состояния
      if (requestKeyRef.current !== requestKey) {
        return;
      }

      setContainers(filteredContainers);
      finishLoading(isInitialLoad, filteredContainers.length);
    } catch (err) {
      // Проверяем, не изменились ли параметры запроса во время выполнения
      if (requestKeyRef.current !== requestKey) {
        return;
      }
      handleError(err, isInitialLoad);
      setContainers([]);
    } finally {
      // Сбрасываем флаг только если это был последний запрос
      if (requestKeyRef.current === requestKey) {
        isLoadingRef.current = false;
        requestKeyRef.current = "";
      }
    }
  };

  useEffect(() => {
    if (user && !isUserLoading) {
      loadContainers(searchQuery, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showDeleted, refreshTrigger, filters.entityTypeId, filters.hasItems, filters.locationType, filters.showDeleted]);

  useDebouncedSearch({
    searchQuery,
    onSearch: (query) => {
      if (user && !isUserLoading) {
        loadContainers(query || undefined, false);
      }
    },
  });

  const handleDeleteContainer = async (containerId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот контейнер?")) {
      return;
    }

    try {
      const response = await softDeleteApi.softDelete("containers", containerId);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Контейнер успешно удален");
      loadContainers(searchQuery, false);
    } catch (err) {
      console.error("Ошибка при удалении контейнера:", err);
      toast.error("Произошла ошибка при удалении контейнера");
    }
  };

  const handleRestoreContainer = async (containerId: number) => {
    try {
      const response = await softDeleteApi.restoreDeleted("containers", containerId);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Контейнер успешно восстановлен");
      loadContainers(searchQuery, false);
    } catch (err) {
      console.error("Ошибка при восстановлении контейнера:", err);
      toast.error("Произошла ошибка при восстановлении контейнера");
    }
  };

  const printLabel = usePrintEntityLabel("container");

  const hasActiveFilters = filters.entityTypeId !== null || filters.hasItems !== null || filters.locationType !== null || filters.showDeleted;
  const activeFiltersCount = [filters.entityTypeId !== null, filters.hasItems !== null, filters.locationType !== null, filters.showDeleted].filter(Boolean).length;

  useEffect(() => {
    onActiveFiltersCountChange?.(activeFiltersCount);
  }, [activeFiltersCount, onActiveFiltersCountChange]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ErrorCard message={error || ""} />

      {isLoading || isUserLoading ? (
        <ListSkeleton variant="table" rows={6} columns={5} />
      ) : isSearching && containers.length === 0 ? (
        <ListSkeleton variant="table" rows={6} columns={5} />
      ) : containers.length === 0 ? (
        <EmptyState
          icon={ContainerIcon}
          title={searchQuery ? "По вашему запросу ничего не найдено" : "Контейнеры не найдены"}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] hidden sm:table-cell whitespace-nowrap overflow-hidden text-ellipsis">ID</TableHead>
                    <TableHead className="whitespace-nowrap overflow-hidden text-ellipsis">Маркировка / Название</TableHead>
                    <TableHead className="hidden lg:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Местоположение</TableHead>
                    <TableHead className="w-[100px] hidden lg:table-cell whitespace-nowrap overflow-hidden text-ellipsis text-center">Содержимое</TableHead>
                    <TableHead className="w-0 text-right whitespace-nowrap overflow-hidden text-ellipsis">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containers.map((container) => (
                    <TableRow
                      key={container.id}
                      className={container.deleted_at ? "opacity-60" : ""}
                    >
                      <TableCell className="hidden sm:table-cell align-top">
                        <div className="flex items-center gap-2 h-10">
                          {container.deleted_at && (
                            <Badge variant="destructive" className="text-xs">Удалено</Badge>
                          )}
                          <span className="text-muted-foreground">#{container.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2 min-w-0">
                          {container.photo_url ? (
                            <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                              <Image
                                src={container.photo_url}
                                alt={getEntityDisplayName("container", container.id, container.name)}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized={container.photo_url.includes("storage.supabase.co")}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                              <ContainerIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/containers/${container.id}`}
                              className="font-medium hover:underline break-words leading-tight block"
                            >
                              {getEntityDisplayName("container", container.id, container.name)}
                            </Link>
                            {container.entity_type?.name && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {container.entity_type.name}
                              </p>
                            )}
                            <div className="lg:hidden mt-1 text-xs text-muted-foreground">
                              {container.last_location ? (
                                <div className="flex items-center gap-1">
                                  {container.last_location.destination_type === "room" && (
                                    <>
                                      <Building2 className="h-3 w-3" />
                                      <span className="truncate">
                                        {getEntityDisplayName("room", container.last_location.destination_id!, container.last_location.destination_name)}
                                      </span>
                                    </>
                                  )}
                                  {container.last_location.destination_type === "place" && (
                                    <>
                                      <Warehouse className="h-3 w-3" />
                                      <span className="truncate">
                                        {getEntityDisplayName("place", container.last_location.destination_id!, container.last_location.destination_name)}
                                      </span>
                                    </>
                                  )}
                                  {container.last_location.destination_type === "container" && (
                                    <>
                                      <ContainerIcon className="h-3 w-3" />
                                      <span className="truncate">
                                        {getEntityDisplayName("container", container.last_location.destination_id!, container.last_location.destination_name)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span>Местоположение не указано</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {container.last_location ? (
                          <div className="space-y-1">
                            {container.last_location.destination_type === "room" && (
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {getEntityDisplayName("room", container.last_location.destination_id!, container.last_location.destination_name)}
                                </span>
                              </div>
                            )}
                            {container.last_location.destination_type === "place" && (
                              <div className="flex items-center gap-2 text-sm">
                                <Warehouse className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {getEntityDisplayName("place", container.last_location.destination_id!, container.last_location.destination_name)}
                                </span>
                              </div>
                            )}
                            {container.last_location.destination_type === "container" && (
                              <div className="flex items-center gap-2 text-sm">
                                <ContainerIcon className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {getEntityDisplayName("container", container.last_location.destination_id!, container.last_location.destination_name)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Не указано</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          {container.itemsCount !== undefined && container.itemsCount > 0 ? (
                            <>
                              <Package className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{container.itemsCount}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">0</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="hidden lg:flex">
                          <ListActions
                            isDeleted={!!container.deleted_at}
                            onEdit={() => router.push(`/containers/${container.id}`)}
                            onMove={() => setMovingContainerId(container.id)}
                            onPrintLabel={() => printLabel(container.id, container.name)}
                            onDelete={() => handleDeleteContainer(container.id)}
                            onRestore={() => handleRestoreContainer(container.id)}
                          />
                        </div>
                        <div className="flex lg:hidden items-center justify-end gap-1">
                          {container.deleted_at ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestoreContainer(container.id)}
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              aria-label="Восстановить"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMovingContainerId(container.id)}
                                className="h-8 w-8"
                                aria-label="Переместить"
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                              <Popover
                                open={mobileActionsContainerId === container.id}
                                onOpenChange={(open) => {
                                  setMobileActionsContainerId(open ? container.id : null);
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label="Открыть меню действий"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-40 p-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2"
                                    onClick={() => {
                                      router.push(`/containers/${container.id}`);
                                      setMobileActionsContainerId(null);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 shrink-0" />
                                    <span>Редактировать</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2"
                                    onClick={() => {
                                      printLabel(container.id, container.name);
                                      setMobileActionsContainerId(null);
                                    }}
                                  >
                                    <Printer className="h-4 w-4 shrink-0" />
                                    <span>Печать этикетки</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      handleDeleteContainer(container.id);
                                      setMobileActionsContainerId(null);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 shrink-0" />
                                    <span>Удалить</span>
                                  </Button>
                                </PopoverContent>
                              </Popover>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Sheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
      >
        <SheetContent
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>Фильтры</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ContainersFiltersPanel
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setInternalShowDeleted(newFilters.showDeleted);
              }}
              onReset={() => {
                const resetFilters: ContainersFilters = {
                  showDeleted: false,
                  entityTypeId: null,
                  hasItems: null,
                  locationType: null,
                };
                setFilters(resetFilters);
                setInternalShowDeleted(false);
              }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </SheetContent>
      </Sheet>

      {movingContainerId && (
        <MoveContainerForm
          containerId={movingContainerId}
          containerName={containers.find((c) => c.id === movingContainerId)?.name || null}
          open={!!movingContainerId}
          onOpenChange={(open) => !open && setMovingContainerId(null)}
          onSuccess={() => {
            setMovingContainerId(null);
            loadContainers(searchQuery, false);
          }}
        />
      )}
    </div>
  );
};

export default ContainersList;
