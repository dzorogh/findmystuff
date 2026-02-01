"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getPlaces } from "@/lib/places/api";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Package, Container, MoreHorizontal, Printer, RotateCcw, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EditPlaceForm from "@/components/forms/edit-place-form";
import MovePlaceForm from "@/components/forms/move-place-form";
import { useListState } from "@/lib/app/hooks/use-list-state";
import { useDebouncedSearch } from "@/lib/app/hooks/use-debounced-search";
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
import { PlacesFiltersPanel, type PlacesFilters } from "@/components/filters/places-filters-panel";
import { toast } from "sonner";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";

interface Place {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  entity_type?: {
    name: string;
  } | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  room?: {
    room_id: number | null;
    room_name: string | null;
  } | null;
  items_count?: number;
  containers_count?: number;
}

interface PlacesListProps {
  refreshTrigger?: number;
  searchQuery?: string;
  showDeleted?: boolean;
  onSearchStateChange?: (state: { isSearching: boolean; resultsCount: number }) => void;
  onFiltersOpenChange?: (open: boolean) => void;
  filtersOpen?: boolean;
  onActiveFiltersCountChange?: (count: number) => void;
}

const PlacesList = ({ refreshTrigger, searchQuery: externalSearchQuery, showDeleted: externalShowDeleted, onSearchStateChange, onFiltersOpenChange, filtersOpen: externalFiltersOpen, onActiveFiltersCountChange }: PlacesListProps = {}) => {
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

  const [filters, setFilters] = useState<PlacesFilters>({
    showDeleted: internalShowDeleted,
    entityTypeId: null,
    roomId: null,
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

  const [places, setPlaces] = useState<Place[]>([]);
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const [movingPlaceId, setMovingPlaceId] = useState<number | null>(null);
  const [mobileActionsPlaceId, setMobileActionsPlaceId] = useState<number | null>(null);

  const isLoadingRef = useRef(false);
  const requestKeyRef = useRef<string>("");

  const loadPlaces = async (query?: string, isInitialLoad = false) => {
    if (!user) return;

    // Создаем уникальный ключ для запроса на основе параметров
    const requestKey = `${query || ""}-${showDeleted}-${filters.entityTypeId}-${filters.roomId}-${filters.showDeleted}`;

    // Проверяем, не выполняется ли уже такой же запрос
    if (isLoadingRef.current && requestKeyRef.current === requestKey) {
      return;
    }

    isLoadingRef.current = true;
    requestKeyRef.current = requestKey;

    startLoading(isInitialLoad);

    try {
      const response = await getPlaces({
        query: query?.trim(),
        showDeleted,
      });

      // API возвращает { data: Place[] }
      // request возвращает это напрямую, поэтому response будет { data: Place[] }
      // И response.data будет Place[]
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        setPlaces([]);
        finishLoading(isInitialLoad, 0);
        return;
      }

      const placesWithRooms: Place[] = response.data;

      // Применяем фильтры
      let filteredPlaces = placesWithRooms;

      if (filters.entityTypeId !== null) {
        filteredPlaces = filteredPlaces.filter(
          (p) => p.entity_type_id === filters.entityTypeId
        );
      }

      if (filters.roomId !== null) {
        filteredPlaces = filteredPlaces.filter(
          (p) => p.room?.room_id === filters.roomId
        );
      }

      // Проверяем еще раз перед обновлением состояния
      if (requestKeyRef.current !== requestKey) {
        return;
      }

      setPlaces(filteredPlaces);
      finishLoading(isInitialLoad, filteredPlaces.length);
    } catch (err) {
      // Проверяем, не изменились ли параметры запроса во время выполнения
      if (requestKeyRef.current !== requestKey) {
        return;
      }
      handleError(err, isInitialLoad);
      setPlaces([]);
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
      loadPlaces(searchQuery, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showDeleted, refreshTrigger, filters.entityTypeId, filters.roomId, filters.showDeleted]);

  useDebouncedSearch({
    searchQuery,
    onSearch: (query) => {
      if (user && !isUserLoading) {
        loadPlaces(query || undefined, false);
      }
    },
  });

  const handleDeletePlace = async (placeId: number) => {
    if (!confirm("Вы уверены, что хотите удалить это место?")) {
      return;
    }

    try {
      const response = await softDeleteApi.softDelete("places", placeId);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Место успешно удалено");
      loadPlaces(searchQuery, false);
    } catch (err) {
      console.error("Ошибка при удалении места:", err);
      toast.error("Произошла ошибка при удалении места");
    }
  };

  const handleRestorePlace = async (placeId: number) => {
    try {
      const response = await softDeleteApi.restoreDeleted("places", placeId);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Место успешно восстановлено");
      loadPlaces(searchQuery, false);
    } catch (err) {
      console.error("Ошибка при восстановлении места:", err);
      toast.error("Произошла ошибка при восстановлении места");
    }
  };

  const printLabel = usePrintEntityLabel("place");

  const hasActiveFilters = filters.entityTypeId !== null || filters.roomId !== null || filters.showDeleted;
  const activeFiltersCount = [filters.entityTypeId !== null, filters.roomId !== null, filters.showDeleted].filter(Boolean).length;

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
        <div className="overflow-x-hidden">
          <ListSkeleton variant="table" rows={6} columns={5} />
        </div>
      ) : isSearching && places.length === 0 ? (
        <div className="overflow-x-hidden">
          <ListSkeleton variant="table" rows={6} columns={5} />
        </div>
      ) : places.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={searchQuery ? "По вашему запросу ничего не найдено" : "Местоположения не найдены"}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-hidden md:overflow-x-auto">
              <Table data-testid="places-list">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] hidden sm:table-cell whitespace-nowrap overflow-hidden text-ellipsis">ID</TableHead>
                    <TableHead className="whitespace-nowrap overflow-hidden text-ellipsis">Название</TableHead>
                    <TableHead className="hidden md:table-cell w-[80px] whitespace-nowrap overflow-hidden text-ellipsis">Вещей</TableHead>
                    <TableHead className="hidden md:table-cell w-[100px] whitespace-nowrap overflow-hidden text-ellipsis">Контейнеров</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Помещение</TableHead>
                    <TableHead className="w-[120px] hidden lg:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Создано</TableHead>
                    <TableHead className="w-[150px] text-right whitespace-nowrap overflow-hidden text-ellipsis">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {places.map((place) => (
                    <TableRow
                      key={place.id}
                      className={place.deleted_at ? "opacity-60" : ""}
                    >
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          {place.deleted_at && (
                            <Badge variant="destructive" className="text-xs">Удалено</Badge>
                          )}
                          <span className="text-muted-foreground">#{place.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          {place.photo_url ? (
                            <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                              <Image
                                src={place.photo_url}
                                alt={place.name || `Место #${place.id}`}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized={place.photo_url.includes("storage.supabase.co")}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/places/${place.id}`}
                              className="font-medium hover:underline break-words leading-tight block"
                            >
                              {place.name || `Место #${place.id}`}
                            </Link>
                            {place.entity_type?.name && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {place.entity_type.name}
                              </p>
                            )}
                            <div className="md:hidden mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {place.items_count ?? 0} вещ.
                              </span>
                              <span className="flex items-center gap-1">
                                <Container className="h-3 w-3" />
                                {place.containers_count ?? 0} конт.
                              </span>
                              {place.room?.room_name && place.room.room_id && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  <span className="truncate">{place.room.room_name}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{place.items_count ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Container className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{place.containers_count ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {place.room?.room_name && place.room.room_id ? (
                          <Link
                            href={`/rooms/${place.room.room_id}`}
                            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                          >
                            <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{place.room.room_name}</span>
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {new Date(place.created_at).toLocaleDateString("ru-RU", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="hidden md:flex">
                          <ListActions
                            isDeleted={!!place.deleted_at}
                            onEdit={() => setEditingPlaceId(place.id)}
                            onMove={() => setMovingPlaceId(place.id)}
                            onPrintLabel={() => printLabel(place.id, place.name)}
                            onDelete={() => handleDeletePlace(place.id)}
                            onRestore={() => handleRestorePlace(place.id)}
                          />
                        </div>
                        <div className="flex md:hidden items-center justify-end gap-1">
                          {place.deleted_at ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestorePlace(place.id)}
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              aria-label="Восстановить"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Popover
                              open={mobileActionsPlaceId === place.id}
                              onOpenChange={(open) => {
                                setMobileActionsPlaceId(open ? place.id : null);
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
                                    setEditingPlaceId(place.id);
                                    setMobileActionsPlaceId(null);
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
                                    setMovingPlaceId(place.id);
                                    setMobileActionsPlaceId(null);
                                  }}
                                >
                                  <ArrowRightLeft className="h-4 w-4 shrink-0" />
                                  <span>Переместить</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start gap-2"
                                  onClick={() => {
                                    printLabel(place.id, place.name);
                                    setMobileActionsPlaceId(null);
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
                                    handleDeletePlace(place.id);
                                    setMobileActionsPlaceId(null);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 shrink-0" />
                                  <span>Удалить</span>
                                </Button>
                              </PopoverContent>
                            </Popover>
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

      {editingPlaceId && (
        <EditPlaceForm
          placeId={editingPlaceId}
          placeName={places.find((p) => p.id === editingPlaceId)?.name || null}
          placeTypeId={places.find((p) => p.id === editingPlaceId)?.entity_type_id || null}
          open={!!editingPlaceId}
          onOpenChange={(open) => !open && setEditingPlaceId(null)}
          onSuccess={() => {
            setEditingPlaceId(null);
            loadPlaces(searchQuery, false);
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
            <PlacesFiltersPanel
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setInternalShowDeleted(newFilters.showDeleted);
              }}
              onReset={() => {
                const resetFilters: PlacesFilters = {
                  showDeleted: false,
                  entityTypeId: null,
                  roomId: null,
                };
                setFilters(resetFilters);
                setInternalShowDeleted(false);
              }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </SheetContent>
      </Sheet>

      {movingPlaceId && (
        <MovePlaceForm
          placeId={movingPlaceId}
          placeName={places.find((p) => p.id === movingPlaceId)?.name || null}
          open={!!movingPlaceId}
          onOpenChange={(open) => !open && setMovingPlaceId(null)}
          onSuccess={() => {
            setMovingPlaceId(null);
            loadPlaces(searchQuery, false);
          }}
        />
      )}
    </div>
  );
};

export default PlacesList;
