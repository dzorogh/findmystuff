"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getRooms } from "@/lib/rooms/api";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Warehouse, Container, Package, MoreHorizontal, Printer, RotateCcw, Pencil, Trash2 } from "lucide-react";
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
import EditRoomForm from "@/components/forms/edit-room-form";
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
import { RoomsFiltersPanel, type RoomsFilters } from "@/components/filters/rooms-filters-panel";
import { toast } from "sonner";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import type { Room } from "@/types/entity";

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
  const [mobileActionsRoomId, setMobileActionsRoomId] = useState<number | null>(null);
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
      const response = await getRooms({
        query: query?.trim(),
        showDeleted,
      });

      // Проверяем, не изменились ли параметры запроса во время выполнения
      if (requestKeyRef.current !== requestKey) {
        return;
      }

      // API возвращает { data: Room[] }
      // request возвращает это напрямую, поэтому response будет { data: Room[] }
      // И response.data будет Room[]
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        setRooms([]);
        finishLoading(isInitialLoad, 0);
        return;
      }

      let roomsWithCounts: Room[] = response.data;

      // Применяем фильтры
      if (filters.hasItems !== null) {
        roomsWithCounts = roomsWithCounts.filter((room) =>
          filters.hasItems ? (room.items_count || 0) > 0 : (room.items_count || 0) === 0
        );
      }
      if (filters.hasContainers !== null) {
        roomsWithCounts = roomsWithCounts.filter((room) =>
          filters.hasContainers ? (room.containers_count || 0) > 0 : (room.containers_count || 0) === 0
        );
      }
      if (filters.hasPlaces !== null) {
        roomsWithCounts = roomsWithCounts.filter((room) =>
          filters.hasPlaces ? (room.places_count || 0) > 0 : (room.places_count || 0) === 0
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
      const response = await softDeleteApi.softDelete("rooms", roomId);
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
      const response = await softDeleteApi.restoreDeleted("rooms", roomId);
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

  const printLabel = usePrintEntityLabel("room");

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ErrorCard message={error || ""} />

      {isLoading || isUserLoading ? (
        <div className="overflow-x-hidden">
          <ListSkeleton variant="table" rows={6} columns={6} />
        </div>
      ) : isSearching && rooms.length === 0 ? (
        <div className="overflow-x-hidden">
          <ListSkeleton variant="table" rows={6} columns={6} />
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery ? "По вашему запросу ничего не найдено" : "Помещения не найдены"}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-hidden md:overflow-x-auto">
              <Table data-testid="rooms-list">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] hidden sm:table-cell whitespace-nowrap overflow-hidden text-ellipsis">ID</TableHead>
                    <TableHead className="whitespace-nowrap overflow-hidden text-ellipsis">Название</TableHead>
                    <TableHead className="hidden md:table-cell w-[80px] whitespace-nowrap overflow-hidden text-ellipsis">Вещей</TableHead>
                    <TableHead className="hidden md:table-cell w-[80px] whitespace-nowrap overflow-hidden text-ellipsis">Мест</TableHead>
                    <TableHead className="hidden lg:table-cell w-[100px] whitespace-nowrap overflow-hidden text-ellipsis">Контейнеров</TableHead>
                    <TableHead className="w-[120px] hidden lg:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Создано</TableHead>
                    <TableHead className="w-[150px] text-right whitespace-nowrap overflow-hidden text-ellipsis">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow
                      key={room.id}
                      className={room.deleted_at ? "opacity-60" : ""}
                    >
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          {room.deleted_at && (
                            <Badge variant="destructive" className="text-xs">Удалено</Badge>
                          )}
                          <span className="text-muted-foreground">#{room.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          {room.photo_url ? (
                            <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                              <Image
                                src={room.photo_url}
                                alt={room.name || `Помещение #${room.id}`}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized={room.photo_url.includes("storage.supabase.co")}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/rooms/${room.id}`}
                              className="font-medium hover:underline break-words leading-tight block"
                            >
                              {room.name || `Помещение #${room.id}`}
                            </Link>
                            {room.room_type?.name && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {room.room_type.name}
                              </p>
                            )}
                            <div className="md:hidden mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {room.items_count || 0} вещ.
                              </span>
                              <span className="flex items-center gap-1">
                                <Warehouse className="h-3 w-3" />
                                {room.places_count || 0} мест
                              </span>
                              <span className="flex items-center gap-1">
                                <Container className="h-3 w-3" />
                                {room.containers_count || 0} конт.
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{room.items_count ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Warehouse className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{room.places_count ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Container className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{room.containers_count ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {new Date(room.created_at).toLocaleDateString("ru-RU", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="hidden md:flex">
                          <ListActions
                            isDeleted={!!room.deleted_at}
                            onEdit={() => setEditingRoomId(room.id)}
                            onPrintLabel={() => printLabel(room.id, room.name)}
                            onDelete={() => handleDeleteRoom(room.id)}
                            onRestore={() => handleRestoreRoom(room.id)}
                          />
                        </div>
                        <div className="flex md:hidden items-center justify-end gap-1">
                          {room.deleted_at ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestoreRoom(room.id)}
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              aria-label="Восстановить"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Popover
                              open={mobileActionsRoomId === room.id}
                              onOpenChange={(open) => {
                                setMobileActionsRoomId(open ? room.id : null);
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
                                    setEditingRoomId(room.id);
                                    setMobileActionsRoomId(null);
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
                                    printLabel(room.id, room.name);
                                    setMobileActionsRoomId(null);
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
                                    handleDeleteRoom(room.id);
                                    setMobileActionsRoomId(null);
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
          roomTypeId={rooms.find((r) => r.id === editingRoomId)?.room_type_id ?? null}
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
