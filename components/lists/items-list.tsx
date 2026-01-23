"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Container, Building2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MoveItemForm from "@/components/forms/move-item-form";
import EditItemForm from "@/components/forms/edit-item-form";
import { useListState } from "@/hooks/use-list-state";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { applyDeletedFilter, applyNameSearch } from "@/lib/query-builder";
import { softDelete, restoreDeleted } from "@/lib/soft-delete";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorCard } from "@/components/common/error-card";
import { ListActions } from "@/components/common/list-actions";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Item {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  last_location?: {
    destination_type: string | null;
    destination_id: number | null;
    destination_name: string | null;
    moved_at: string;
    place_name?: string | null;
    room_name?: string | null;
  } | null;
}

interface ItemsListProps {
  refreshTrigger?: number;
  searchQuery?: string;
  showDeleted?: boolean;
  onSearchStateChange?: (state: { isSearching: boolean; resultsCount: number }) => void;
}

const ItemsList = ({ refreshTrigger, searchQuery: externalSearchQuery, showDeleted: externalShowDeleted, onSearchStateChange }: ItemsListProps = {}) => {
  const {
    user,
    isUserLoading,
    isLoading,
    isSearching,
    error,
    searchQuery,
    showDeleted,
    setError,
    startLoading,
    finishLoading,
    handleError,
  } = useListState({
    externalSearchQuery,
    externalShowDeleted,
    refreshTrigger,
    onSearchStateChange,
  });

  const [items, setItems] = useState<Item[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [movingItemId, setMovingItemId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const startLoadingRef = useRef(startLoading);
  const finishLoadingRef = useRef(finishLoading);
  const handleErrorRef = useRef(handleError);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    startLoadingRef.current = startLoading;
    finishLoadingRef.current = finishLoading;
    handleErrorRef.current = handleError;
  }, [startLoading, finishLoading, handleError]);

  const loadItems = useCallback(async (query?: string, isInitialLoad = false, page = 1) => {
    if (!user) return;
    if (!isMountedRef.current) return;

    startLoadingRef.current(isInitialLoad);

    try {
      const supabase = createClient();
      
      // Сначала получаем общее количество для пагинации
      let countQueryBuilder = supabase
        .from("items")
        .select("*", { count: "exact", head: true });

      if (!showDeleted) {
        countQueryBuilder = countQueryBuilder.is("deleted_at", null);
      } else {
        countQueryBuilder = countQueryBuilder.not("deleted_at", "is", null);
      }

      if (query && query.trim()) {
        countQueryBuilder = countQueryBuilder.ilike("name", `%${query.trim()}%`);
      }

      const { count, error: countError } = await countQueryBuilder;

      if (!isMountedRef.current) return;

      if (countError) {
        console.error("Ошибка при подсчете количества:", countError.message || countError.code || countError);
        setTotalCount(0);
      } else {
        const total = count || 0;
        setTotalCount(total);
        console.log("Total count:", total, "Items per page:", itemsPerPage);
      }

      // Затем получаем данные с пагинацией
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let queryBuilder = supabase
        .from("items")
        .select("id, name, created_at, deleted_at, photo_url")
        .order("created_at", { ascending: false })
        .range(from, to);

      queryBuilder = applyDeletedFilter(queryBuilder, showDeleted);
      queryBuilder = applyNameSearch(queryBuilder, query, ["name"]);

      const { data: itemsData, error: itemsError } = await queryBuilder;

      if (!isMountedRef.current) return;

      if (itemsError) {
        throw itemsError;
      }

      if (!itemsData || itemsData.length === 0) {
        if (isMountedRef.current) {
          setItems([]);
          finishLoadingRef.current(isInitialLoad, 0);
        }
        return;
      }

      const itemIds = itemsData.map((item) => item.id);
      const { data: transitionsData, error: transitionsError } = await supabase
        .from("transitions")
        .select("*")
        .in("item_id", itemIds)
        .order("created_at", { ascending: false });

      if (!isMountedRef.current) return;

      if (transitionsError) {
        throw transitionsError;
      }

      const lastTransitionsByItem = new Map<number, any>();
      (transitionsData || []).forEach((transition) => {
        if (!lastTransitionsByItem.has(transition.item_id)) {
          lastTransitionsByItem.set(transition.item_id, transition);
        }
      });

      const placeIds = Array.from(lastTransitionsByItem.values())
        .filter((t) => t.destination_type === "place" && t.destination_id)
        .map((t) => t.destination_id);

      const containerIds = Array.from(lastTransitionsByItem.values())
        .filter((t) => t.destination_type === "container" && t.destination_id)
        .map((t) => t.destination_id);

      const roomIds = Array.from(lastTransitionsByItem.values())
        .filter((t) => t.destination_type === "room" && t.destination_id)
        .map((t) => t.destination_id);

      const [placesData, containersData, roomsData] = await Promise.all([
        placeIds.length > 0
          ? supabase
              .from("places")
              .select("id, name")
              .in("id", placeIds)
              .is("deleted_at", null)
          : { data: [], error: null },
        containerIds.length > 0
          ? supabase
              .from("containers")
              .select("id, name")
              .in("id", containerIds)
              .is("deleted_at", null)
          : { data: [], error: null },
        roomIds.length > 0
          ? supabase
              .from("rooms")
              .select("id, name")
              .in("id", roomIds)
              .is("deleted_at", null)
          : { data: [], error: null },
      ]);

      const placesMap = new Map(
        (placesData.data || []).map((p) => [p.id, p.name])
      );
      const containersMap = new Map(
        (containersData.data || []).map((c) => [c.id, c.name])
      );
      const roomsMap = new Map(
        (roomsData.data || []).map((r) => [r.id, r.name])
      );

      // Загружаем transitions для мест, чтобы узнать их помещения
      const allPlaceIds = Array.from(placesMap.keys());
      const { data: placesTransitionsData } = allPlaceIds.length > 0
        ? await supabase
            .from("transitions")
            .select("*")
            .eq("destination_type", "room")
            .in("place_id", allPlaceIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      const lastPlaceTransitions = new Map<number, any>();
      (placesTransitionsData || []).forEach((t) => {
        if (t.place_id && !lastPlaceTransitions.has(t.place_id)) {
          lastPlaceTransitions.set(t.place_id, t);
        }
      });

      const placeRoomIds = Array.from(lastPlaceTransitions.values())
        .map((t) => t.destination_id)
        .filter((id) => id !== null);

      const { data: placeRoomsData } = placeRoomIds.length > 0
        ? await supabase
            .from("rooms")
            .select("id, name")
            .in("id", placeRoomIds)
            .is("deleted_at", null)
        : { data: [] };

      const placeRoomsMap = new Map(
        (placeRoomsData || []).map((r) => [r.id, r.name])
      );

      // Загружаем transitions для контейнеров
      const allContainerIds = Array.from(containersMap.keys());
      const { data: containersTransitionsData } = allContainerIds.length > 0
        ? await supabase
            .from("transitions")
            .select("*")
            .in("container_id", allContainerIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      const lastContainerTransitions = new Map<number, any>();
      (containersTransitionsData || []).forEach((t) => {
        if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
          lastContainerTransitions.set(t.container_id, t);
        }
      });

      // Для контейнеров, которые находятся в местах, получаем помещения этих мест
      const containerPlaceIds = Array.from(lastContainerTransitions.values())
        .filter((t) => t.destination_type === "place" && t.destination_id)
        .map((t) => t.destination_id);

      // Загружаем transitions для всех мест, где находятся контейнеры (если еще не загружены)
      const missingPlaceIds = containerPlaceIds.filter((id) => !lastPlaceTransitions.has(id));
      if (missingPlaceIds.length > 0) {
        const { data: missingPlacesTransitionsData } = await supabase
          .from("transitions")
          .select("*")
          .eq("destination_type", "room")
          .in("place_id", missingPlaceIds)
          .order("created_at", { ascending: false });

        (missingPlacesTransitionsData || []).forEach((t) => {
          if (t.place_id && !lastPlaceTransitions.has(t.place_id)) {
            lastPlaceTransitions.set(t.place_id, t);
          }
        });
      }

      const containerPlaceRoomIds = containerPlaceIds
        .map((placeId) => {
          const placeTransition = lastPlaceTransitions.get(placeId);
          return placeTransition?.destination_id;
        })
        .filter((id) => id !== null);

      // Объединяем с уже загруженными помещениями мест
      const allPlaceRoomIds = Array.from(new Set([
        ...placeRoomIds,
        ...containerPlaceRoomIds
      ]));

      const { data: allPlaceRoomsData } = allPlaceRoomIds.length > 0
        ? await supabase
            .from("rooms")
            .select("id, name")
            .in("id", allPlaceRoomIds)
            .is("deleted_at", null)
        : { data: [] };

      const allPlaceRoomsMap = new Map(
        (allPlaceRoomsData || []).map((r) => [r.id, r.name])
      );

      // Обновляем placeRoomsMap, чтобы включить все помещения
      allPlaceRoomsMap.forEach((name, id) => {
        placeRoomsMap.set(id, name);
      });

      const containerPlaceRoomsMap = new Map(
        containerPlaceRoomIds.map((roomId) => [roomId, allPlaceRoomsMap.get(roomId) || null])
      );

      // Для контейнеров, которые находятся в помещениях
      const containerRoomIds = Array.from(lastContainerTransitions.values())
        .filter((t) => t.destination_type === "room" && t.destination_id)
        .map((t) => t.destination_id);

      const containerRoomsMap = new Map<number, string | null>();
      containerRoomIds.forEach((roomId) => {
        containerRoomsMap.set(roomId, roomsMap.get(roomId) || null);
      });

      const itemsWithLocation = itemsData.map((item) => {
        const lastTransition = lastTransitionsByItem.get(item.id);

        if (!lastTransition) {
          return {
            id: item.id,
            name: item.name,
            created_at: item.created_at,
            deleted_at: item.deleted_at,
            photo_url: item.photo_url,
            last_location: null,
          };
        }

        let destinationName: string | null = null;
        let placeName: string | null = null;
        let roomName: string | null = null;

        if (lastTransition.destination_type === "room") {
          // Вещь в помещении
          destinationName = roomsMap.get(lastTransition.destination_id) || null;
          roomName = destinationName;
        } else if (lastTransition.destination_type === "place") {
          // Вещь в месте - показываем место и помещение
          destinationName = placesMap.get(lastTransition.destination_id) || null;
          placeName = destinationName;
          const placeTransition = lastPlaceTransitions.get(lastTransition.destination_id);
          if (placeTransition) {
            roomName = placeRoomsMap.get(placeTransition.destination_id) || null;
          }
        } else if (lastTransition.destination_type === "container") {
          // Вещь в контейнере - показываем контейнер, место (если есть) и помещение
          destinationName = containersMap.get(lastTransition.destination_id) || null;
          const containerTransition = lastContainerTransitions.get(lastTransition.destination_id);
          if (containerTransition) {
            if (containerTransition.destination_type === "place") {
              placeName = placesMap.get(containerTransition.destination_id) || null;
              const placeTransition = lastPlaceTransitions.get(containerTransition.destination_id);
              if (placeTransition) {
                // Используем общую карту помещений
                roomName = placeRoomsMap.get(placeTransition.destination_id) || null;
              }
            } else if (containerTransition.destination_type === "room") {
              roomName = containerRoomsMap.get(containerTransition.destination_id) || null;
            } else if (containerTransition.destination_type === "container") {
              // Контейнер в контейнере - рекурсивно находим помещение
              const parentContainerTransition = lastContainerTransitions.get(containerTransition.destination_id);
              if (parentContainerTransition) {
                if (parentContainerTransition.destination_type === "place") {
                  placeName = placesMap.get(parentContainerTransition.destination_id) || null;
                  const placeTransition = lastPlaceTransitions.get(parentContainerTransition.destination_id);
                  if (placeTransition) {
                    roomName = placeRoomsMap.get(placeTransition.destination_id) || null;
                  }
                } else if (parentContainerTransition.destination_type === "room") {
                  roomName = containerRoomsMap.get(parentContainerTransition.destination_id) || null;
                }
              }
            }
          }
        }

        return {
          id: item.id,
          name: item.name,
          created_at: item.created_at,
          deleted_at: item.deleted_at,
          photo_url: item.photo_url,
          last_location: {
            destination_type: lastTransition.destination_type,
            destination_id: lastTransition.destination_id,
            destination_name: destinationName,
            moved_at: lastTransition.created_at,
            place_name: placeName,
            room_name: roomName,
          },
        };
      });

      if (isMountedRef.current) {
        setItems(itemsWithLocation);
        finishLoadingRef.current(isInitialLoad, itemsWithLocation.length);
      }
    } catch (err) {
      if (isMountedRef.current) {
        handleErrorRef.current(err, isInitialLoad);
        setItems([]);
      }
    }
  }, [user?.id, showDeleted]);

  useEffect(() => {
    if (user && !isUserLoading) {
      setCurrentPage(1);
      loadItems(searchQuery, true, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showDeleted, refreshTrigger]);

  const handleSearch = useCallback((query: string) => {
    if (user && !isUserLoading) {
      setCurrentPage(1);
      loadItems(query || undefined, false, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isUserLoading]);

  useDebouncedSearch({
    searchQuery,
    onSearch: handleSearch,
    skipInitial: true,
  });

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту вещь?")) {
      return;
    }

    try {
      await softDelete("items", itemId);
      toast.success("Вещь успешно удалена");
      loadItems(searchQuery, false, currentPage);
    } catch (err) {
      console.error("Ошибка при удалении вещи:", err);
      toast.error("Произошла ошибка при удалении вещи");
    }
  };

  const handleRestoreItem = async (itemId: number) => {
    try {
      await restoreDeleted("items", itemId);
      toast.success("Вещь успешно восстановлена");
      loadItems(searchQuery, false, currentPage);
    } catch (err) {
      console.error("Ошибка при восстановлении вещи:", err);
      toast.error("Произошла ошибка при восстановлении вещи");
    }
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="space-y-6">
        <ListSkeleton variant="table" rows={6} columns={5} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ErrorCard message={error || ""} />

      {isSearching && items.length === 0 ? (
        <ListSkeleton variant="table" rows={6} columns={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={searchQuery ? "По вашему запросу ничего не найдено" : "Вещи не найдены"}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] hidden sm:table-cell whitespace-nowrap overflow-hidden text-ellipsis">ID</TableHead>
                    <TableHead className="whitespace-nowrap overflow-hidden text-ellipsis">Название</TableHead>
                    <TableHead className="hidden md:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Местоположение</TableHead>
                    <TableHead className="w-[120px] hidden lg:table-cell whitespace-nowrap overflow-hidden text-ellipsis">Дата перемещения</TableHead>
                    <TableHead className="w-[150px] text-right whitespace-nowrap overflow-hidden text-ellipsis">Действия</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.deleted_at ? "opacity-60" : ""}
                  >
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {item.deleted_at && (
                          <Badge variant="destructive" className="text-xs">Удалено</Badge>
                        )}
                        <span className="text-muted-foreground">#{item.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        {item.photo_url ? (
                          <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                            <Image
                              src={item.photo_url}
                              alt={item.name || `Вещь #${item.id}`}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized={item.photo_url.includes("storage.supabase.co")}
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/items/${item.id}`}
                            className="font-medium hover:underline break-words leading-tight block"
                          >
                            {item.name || `Вещь #${item.id}`}
                          </Link>
                          <div className="md:hidden mt-1 text-xs text-muted-foreground space-y-0.5">
                            {item.last_location ? (
                              <div className="space-y-0.5">
                                {item.last_location.destination_type === "room" && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    <span className="truncate">
                                      {item.last_location.destination_name ||
                                        `Помещение #${item.last_location.destination_id}`}
                                    </span>
                                  </div>
                                )}
                                {item.last_location.destination_type === "place" && (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">
                                        {item.last_location.destination_name ||
                                          `Место #${item.last_location.destination_id}`}
                                      </span>
                                    </div>
                                    {item.last_location.room_name && (
                                      <div className="flex items-center gap-1 ml-4">
                                        <Building2 className="h-2.5 w-2.5" />
                                        <span className="truncate">{item.last_location.room_name}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                {item.last_location.destination_type === "container" && (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <Container className="h-3 w-3" />
                                      <span className="truncate">
                                        {item.last_location.destination_name ||
                                          `Контейнер #${item.last_location.destination_id}`}
                                      </span>
                                    </div>
                                    {item.last_location.place_name && (
                                      <div className="flex items-center gap-1 ml-4">
                                        <MapPin className="h-2.5 w-2.5" />
                                        <span className="truncate">{item.last_location.place_name}</span>
                                      </div>
                                    )}
                                    {item.last_location.room_name && (
                                      <div className="flex items-center gap-1 ml-4">
                                        <Building2 className="h-2.5 w-2.5" />
                                        <span className="truncate">{item.last_location.room_name}</span>
                                      </div>
                                    )}
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
                      {item.last_location ? (
                        <div className="space-y-1">
                          {item.last_location.destination_type === "room" && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                              <span>
                                {item.last_location.destination_name ||
                                  `Помещение #${item.last_location.destination_id}`}
                              </span>
                            </div>
                          )}
                          {item.last_location.destination_type === "place" && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {item.last_location.destination_name ||
                                    `Место #${item.last_location.destination_id}`}
                                </span>
                              </div>
                              {item.last_location.room_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                                  <Building2 className="h-3 w-3 flex-shrink-0" />
                                  <span>{item.last_location.room_name}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {item.last_location.destination_type === "container" && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Container className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {item.last_location.destination_name ||
                                    `Контейнер #${item.last_location.destination_id}`}
                                </span>
                              </div>
                              {item.last_location.place_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span>{item.last_location.place_name}</span>
                                </div>
                              )}
                              {item.last_location.room_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                                  <Building2 className="h-3 w-3 flex-shrink-0" />
                                  <span>{item.last_location.room_name}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Не указано</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.last_location ? (
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.last_location.moved_at).toLocaleDateString("ru-RU", {
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
                        isDeleted={!!item.deleted_at}
                        onEdit={() => setEditingItemId(item.id)}
                        onMove={() => setMovingItemId(item.id)}
                        onDelete={() => handleDeleteItem(item.id)}
                        onRestore={() => handleRestoreItem(item.id)}
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

      {editingItemId && (
        <EditItemForm
          itemId={editingItemId}
          itemName={items.find((i) => i.id === editingItemId)?.name || null}
          open={!!editingItemId}
          onOpenChange={(open) => !open && setEditingItemId(null)}
          onSuccess={() => {
            setEditingItemId(null);
            loadItems(searchQuery, false, currentPage);
          }}
        />
      )}

      {movingItemId && (
        <MoveItemForm
          itemId={movingItemId}
          itemName={items.find((i) => i.id === movingItemId)?.name || null}
          open={!!movingItemId}
          onOpenChange={(open) => !open && setMovingItemId(null)}
          onSuccess={() => {
            setMovingItemId(null);
            loadItems(searchQuery, false, currentPage);
          }}
        />
      )}

      {totalCount > itemsPerPage && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    loadItems(searchQuery, false, newPage);
                  }
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {(() => {
              const totalPages = Math.ceil(totalCount / itemsPerPage);
              const pages: (number | "ellipsis")[] = [];
              
              if (totalPages <= 7) {
                // Показываем все страницы
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Показываем первую страницу
                pages.push(1);
                
                if (currentPage <= 3) {
                  // Текущая страница в начале
                  for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                  }
                  pages.push("ellipsis");
                  pages.push(totalPages);
                } else if (currentPage >= totalPages - 2) {
                  // Текущая страница в конце
                  pages.push("ellipsis");
                  for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Текущая страница в середине
                  pages.push("ellipsis");
                  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                  }
                  pages.push("ellipsis");
                  pages.push(totalPages);
                }
              }

              return pages.map((page, index) => {
                if (page === "ellipsis") {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => {
                        setCurrentPage(page);
                        loadItems(searchQuery, false, page);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              });
            })()}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  const totalPages = Math.ceil(totalCount / itemsPerPage);
                  if (currentPage < totalPages) {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    loadItems(searchQuery, false, newPage);
                  }
                }}
                className={currentPage >= Math.ceil(totalCount / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ItemsList;
