"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Container, Package, Filter } from "lucide-react";
import Image from "next/image";
import EditRoomForm from "@/components/forms/edit-room-form";
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
import { RoomsFiltersPanel, type RoomsFilters } from "@/components/filters/rooms-filters-panel";
import { toast } from "sonner";

interface Room {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  items_count: number;
  places_count: number;
  containers_count: number;
}

interface RoomsListProps {
  refreshTrigger?: number;
  searchQuery?: string;
  showDeleted?: boolean;
  onSearchStateChange?: (state: { isSearching: boolean; resultsCount: number }) => void;
  onFiltersOpenChange?: (open: boolean) => void;
  filtersOpen?: boolean;
  onActiveFiltersCountChange?: (count: number) => void;
}

const RoomsList = ({ refreshTrigger, searchQuery: externalSearchQuery, showDeleted: externalShowDeleted, onSearchStateChange, onFiltersOpenChange, filtersOpen: externalFiltersOpen, onActiveFiltersCountChange }: RoomsListProps = {}) => {
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
    externalShowDeleted: internalShowDeleted,
    refreshTrigger,
    onSearchStateChange,
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [filters, setFilters] = useState<RoomsFilters>({
    showDeleted: internalShowDeleted,
    hasItems: null,
    hasContainers: null,
    hasPlaces: null,
  });

  const isLoadingRef = useRef(false);
  const requestKeyRef = useRef<string>("");

  const loadRooms = async (query?: string, isInitialLoad = false) => {
    if (!user) return;

    // Создаем уникальный ключ для запроса на основе параметров
    const requestKey = `${query || ""}-${showDeleted}-${filters.hasItems}-${filters.hasContainers}-${filters.hasPlaces}-${filters.showDeleted}`;

    // Проверяем, не выполняется ли уже такой же запрос
    if (isLoadingRef.current && requestKeyRef.current === requestKey) {
      return;
    }

    isLoadingRef.current = true;
    requestKeyRef.current = requestKey;

    startLoading(isInitialLoad);

    try {
      const response = await apiClient.getRooms({
        query: query?.trim(),
        showDeleted,
      });

      // Проверяем, не изменились ли параметры запроса во время выполнения
      if (requestKeyRef.current !== requestKey) {
        return;
      }

      if (!response.data || response.data.length === 0) {
        setRooms([]);
        finishLoading(isInitialLoad, 0);
        return;
      }

      let roomsWithCounts: Room[] = response.data;

      // Применяем фильтры
      if (filters.hasItems !== null) {
        roomsWithCounts = roomsWithCounts.filter((room) =>
          filters.hasItems ? room.items_count > 0 : room.items_count === 0
        );
      }
      if (filters.hasContainers !== null) {
        roomsWithCounts = roomsWithCounts.filter((room) =>
          filters.hasContainers ? room.containers_count > 0 : room.containers_count === 0
        );
      }
      if (filters.hasPlaces !== null) {
        roomsWithCounts = roomsWithCounts.filter((room) =>
          filters.hasPlaces ? room.places_count > 0 : room.places_count === 0
        );
      }

      // Проверяем еще раз перед обновлением состояния
      if (requestKeyRef.current !== requestKey) {
        return;
      }

      setRooms(roomsWithCounts);
      finishLoading(isInitialLoad, roomsWithCounts.length);
    } catch (err) {
      // Проверяем, не изменились ли параметры запроса во время выполнения
      if (requestKeyRef.current !== requestKey) {
        return;
      }
      handleError(err, isInitialLoad);
      setRooms([]);
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
      loadRooms(searchQuery, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showDeleted, refreshTrigger, filters.hasItems, filters.hasContainers, filters.hasPlaces, filters.showDeleted]);

  useDebouncedSearch({
    searchQuery,
    onSearch: (query) => {
      if (user && !isUserLoading) {
        loadRooms(query || undefined, false);
      }
    },
  });

  const hasActiveFilters = filters.hasItems !== null || filters.hasContainers !== null || filters.hasPlaces !== null || filters.showDeleted;
  const activeFiltersCount = [filters.hasItems !== null, filters.hasContainers !== null, filters.hasPlaces !== null, filters.showDeleted].filter(Boolean).length;

  useEffect(() => {
    onActiveFiltersCountChange?.(activeFiltersCount);
  }, [activeFiltersCount, onActiveFiltersCountChange]);

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Вы уверены, что хотите удалить это помещение?")) {
      return;
    }

    try {
      const response = await apiClient.softDelete("rooms", roomId);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Помещение успешно удалено");
      loadRooms(searchQuery, false);
    } catch (err) {
      console.error("Ошибка при удалении помещения:", err);
      toast.error("Произошла ошибка при удалении помещения");
    }
  };

  const handleRestoreRoom = async (roomId: number) => {
    try {
      const response = await apiClient.restoreDeleted("rooms", roomId);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Помещение успешно восстановлено");
      loadRooms(searchQuery, false);
    } catch (err) {
      console.error("Ошибка при восстановлении помещения:", err);
      toast.error("Произошла ошибка при восстановлении помещения");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ErrorCard message={error || ""} />

      {isLoading || isUserLoading ? (
        <ListSkeleton variant="grid" rows={6} />
      ) : isSearching && rooms.length === 0 ? (
        <ListSkeleton variant="grid" rows={6} />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery ? "По вашему запросу ничего не найдено" : "Помещения не найдены"}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className={room.deleted_at ? "opacity-60 border-destructive/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {room.photo_url ? (
                      <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                        <Image
                          src={room.photo_url}
                          alt={room.name || `Помещение #${room.id}`}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <Link
                      href={`/rooms/${room.id}`}
                      className="font-medium hover:underline break-words leading-tight block"
                    >
                      <CardTitle className="text-lg truncate">
                        {room.name || `Помещение #${room.id}`}
                      </CardTitle>
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {room.deleted_at && (
                      <Badge variant="destructive" className="text-xs">Удалено</Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">#{room.id}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <Package className="h-3 w-3 flex-shrink-0" />
                    <span>{room.items_count || 0} вещей</span>
                  </div>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{room.places_count || 0} мест</span>
                  </div>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <Container className="h-3 w-3 flex-shrink-0" />
                    <span>{room.containers_count || 0} контейнеров</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Создано:{" "}
                  {new Date(room.created_at).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
              <div className="border-t px-6 py-3">
                <ListActions
                  isDeleted={!!room.deleted_at}
                  onEdit={() => setEditingRoomId(room.id)}
                  onDelete={() => handleDeleteRoom(room.id)}
                  onRestore={() => handleRestoreRoom(room.id)}
                />
              </div>
            </Card>
          ))}
        </div>
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
            <RoomsFiltersPanel
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setInternalShowDeleted(newFilters.showDeleted);
              }}
              onReset={() => {
                const resetFilters: RoomsFilters = {
                  showDeleted: false,
                  hasItems: null,
                  hasContainers: null,
                  hasPlaces: null,
                };
                setFilters(resetFilters);
                setInternalShowDeleted(false);
              }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </SheetContent>
      </Sheet>

      {editingRoomId && (
        <EditRoomForm
          roomId={editingRoomId}
          roomName={rooms.find((r) => r.id === editingRoomId)?.name || null}
          open={!!editingRoomId}
          onOpenChange={(open) => !open && setEditingRoomId(null)}
          onSuccess={() => {
            setEditingRoomId(null);
            loadRooms(searchQuery, false);
          }}
        />
      )}
    </div>
  );
};

export default RoomsList;
