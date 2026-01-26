"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { Container } from "@/types/entity";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, MapPin, Building2, Package, PackageX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import EditContainerForm from "@/components/forms/edit-container-form";
import MoveContainerForm from "@/components/forms/move-container-form";
import { useContainerMarking } from "@/hooks/use-container-marking";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListState } from "@/hooks/use-list-state";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorCard } from "@/components/common/error-card";
import { ListActions } from "@/components/common/list-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ContainersFiltersPanel, type ContainersFilters } from "@/components/filters/containers-filters-panel";
import { toast } from "sonner";

interface Container {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  entity_type?: {
    code: string;
    name: string;
  } | null;
  marking_number: number | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  itemsCount?: number;
  last_location?: {
    destination_type: string | null;
    destination_id: number | null;
    destination_name: string | null;
    moved_at: string;
  } | null;
}

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
  const [editingContainerId, setEditingContainerId] = useState<number | null>(null);
  const [movingContainerId, setMovingContainerId] = useState<number | null>(null);
  const { generateMarking } = useContainerMarking();

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
      const response = await apiClient.getContainers({
        query: query?.trim(),
        showDeleted,
      });

      if (!response.data || response.data.length === 0) {
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
      const response = await apiClient.softDelete("containers", containerId);
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
      const response = await apiClient.restoreDeleted("containers", containerId);
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

  const hasActiveFilters = filters.entityTypeId !== null || filters.hasItems !== null || filters.locationType !== null || filters.showDeleted;
  const activeFiltersCount = [filters.entityTypeId !== null, filters.hasItems !== null, filters.locationType !== null, filters.showDeleted].filter(Boolean).length;

  useEffect(() => {
    onActiveFiltersCountChange?.(activeFiltersCount);
  }, [activeFiltersCount, onActiveFiltersCountChange]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ErrorCard message={error || ""} />

      {isLoading || isUserLoading ? (
        <ListSkeleton variant="table" rows={6} columns={5} />
      ) : isSearching && containers.length === 0 ? (
        <ListSkeleton variant="table" rows={6} columns={5} />
      ) : containers.length === 0 ? (
        <EmptyState
          icon={Container}
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
                    <TableHead className="hidden md:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Местоположение</TableHead>
                    <TableHead className="w-[100px] hidden lg:table-cell whitespace-nowrap overflow-hidden text-ellipsis text-center">Содержимое</TableHead>
                    <TableHead className="w-[120px] hidden lg:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Дата перемещения</TableHead>
                    <TableHead className="w-[150px] text-right whitespace-nowrap overflow-hidden text-ellipsis">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containers.map((container) => (
                    <TableRow
                      key={container.id}
                      className={container.deleted_at ? "opacity-60" : ""}
                    >
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          {container.deleted_at && (
                            <Badge variant="destructive" className="text-xs">Удалено</Badge>
                          )}
                          <span className="text-muted-foreground">#{container.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          {container.photo_url ? (
                            <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                              <Image
                                src={container.photo_url}
                                alt={container.name || `Контейнер #${container.id}`}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized={container.photo_url.includes("storage.supabase.co")}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                              <Container className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/containers/${container.id}`}
                              className="font-medium hover:underline break-words leading-tight block"
                            >
                              {container.name || `Контейнер #${container.id}`}
                            </Link>
                            {container.entity_type && generateMarking(container.entity_type.code, container.marking_number) && (
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                {generateMarking(container.entity_type.code, container.marking_number)}
                              </p>
                            )}
                            <div className="md:hidden mt-1 text-xs text-muted-foreground">
                              {container.last_location ? (
                                <div className="flex items-center gap-1">
                                  {container.last_location.destination_type === "room" && (
                                    <>
                                      <Building2 className="h-3 w-3" />
                                      <span className="truncate">
                                        {container.last_location.destination_name ||
                                          `Помещение #${container.last_location.destination_id}`}
                                      </span>
                                    </>
                                  )}
                                  {container.last_location.destination_type === "place" && (
                                    <>
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">
                                        {container.last_location.destination_name ||
                                          `Место #${container.last_location.destination_id}`}
                                      </span>
                                    </>
                                  )}
                                  {container.last_location.destination_type === "container" && (
                                    <>
                                      <Container className="h-3 w-3" />
                                      <span className="truncate">
                                        {container.last_location.destination_name ||
                                          `Контейнер #${container.last_location.destination_id}`}
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
                      <TableCell className="hidden md:table-cell">
                        {container.last_location ? (
                          <div className="space-y-1">
                            {container.last_location.destination_type === "room" && (
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {container.last_location.destination_name ||
                                    `Помещение #${container.last_location.destination_id}`}
                                </span>
                              </div>
                            )}
                            {container.last_location.destination_type === "place" && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {container.last_location.destination_name ||
                                    `Место #${container.last_location.destination_id}`}
                                </span>
                              </div>
                            )}
                            {container.last_location.destination_type === "container" && (
                              <div className="flex items-center gap-2 text-sm">
                                <Container className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {container.last_location.destination_name ||
                                    `Контейнер #${container.last_location.destination_id}`}
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
                      <TableCell className="hidden lg:table-cell">
                        {container.last_location ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(container.last_location.moved_at).toLocaleDateString("ru-RU", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ListActions
                        isDeleted={!!container.deleted_at}
                        onEdit={() => setEditingContainerId(container.id)}
                        onMove={() => setMovingContainerId(container.id)}
                        onDelete={() => handleDeleteContainer(container.id)}
                        onRestore={() => handleRestoreContainer(container.id)}
                      />
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {editingContainerId && (
        <EditContainerForm
          containerId={editingContainerId}
          containerName={containers.find((c) => c.id === editingContainerId)?.name || null}
          containerTypeId={containers.find((c) => c.id === editingContainerId)?.entity_type_id || null}
          markingNumber={containers.find((c) => c.id === editingContainerId)?.marking_number || null}
          open={!!editingContainerId}
          onOpenChange={(open) => !open && setEditingContainerId(null)}
          onSuccess={() => {
            setEditingContainerId(null);
            loadContainers(searchQuery, false);
          }}
        />
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
