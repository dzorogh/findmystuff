"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2 } from "lucide-react";
import Image from "next/image";
import EditPlaceForm from "@/components/forms/edit-place-form";
import MovePlaceForm from "@/components/forms/move-place-form";
import { usePlaceMarking } from "@/hooks/use-place-marking";
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
import { PlacesFiltersPanel, type PlacesFilters } from "@/components/filters/places-filters-panel";
import { toast } from "sonner";

interface Place {
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
  room?: {
    room_id: number | null;
    room_name: string | null;
  } | null;
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
  const { generateMarking } = usePlaceMarking();

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
      const response = await apiClient.getPlaces({
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
      const response = await apiClient.softDelete("places", placeId);
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
      const response = await apiClient.restoreDeleted("places", placeId);
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
        <ListSkeleton variant="grid" rows={6} />
      ) : isSearching && places.length === 0 ? (
        <ListSkeleton variant="grid" rows={6} />
      ) : places.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={searchQuery ? "По вашему запросу ничего не найдено" : "Местоположения не найдены"}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Card key={place.id} className={place.deleted_at ? "opacity-60 border-destructive/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {place.photo_url ? (
                      <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                        <Image
                          src={place.photo_url}
                          alt={place.name || `Место #${place.id}`}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <Link
                        href={`/places/${place.id}`}
                        className="font-medium hover:underline break-words leading-tight block"
                      >
                        <CardTitle className="text-lg truncate">
                          {place.name || `Место #${place.id}`}
                        </CardTitle>
                      </Link>
                      {place.entity_type && place.marking_number != null && (
                        <p className="text-sm font-semibold font-mono text-primary mt-0.5">
                          {generateMarking(place.entity_type.code, place.marking_number) || `${place.entity_type.code}${place.marking_number}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {place.deleted_at && (
                      <Badge variant="destructive" className="text-xs">Удалено</Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">#{place.id}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {place.room?.room_name && place.room.room_id && (
                  <Link
                    href={`/rooms/${place.room.room_id}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium hover:underline">
                      {place.room.room_name}
                    </span>
                  </Link>
                )}
                <p className="text-xs text-muted-foreground">
                  Создано:{" "}
                  {new Date(place.created_at).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
              <div className="border-t px-6 py-3">
                <ListActions
                  isDeleted={!!place.deleted_at}
                  onEdit={() => setEditingPlaceId(place.id)}
                  onMove={() => setMovingPlaceId(place.id)}
                  onDelete={() => handleDeletePlace(place.id)}
                  onRestore={() => handleRestorePlace(place.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {editingPlaceId && (
        <EditPlaceForm
          placeId={editingPlaceId}
          placeName={places.find((p) => p.id === editingPlaceId)?.name || null}
          placeTypeId={places.find((p) => p.id === editingPlaceId)?.entity_type_id || null}
          markingNumber={places.find((p) => p.id === editingPlaceId)?.marking_number || null}
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
