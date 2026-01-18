"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Pencil, Trash2, RotateCcw } from "lucide-react";
import Image from "next/image";
import EditPlaceForm from "@/components/forms/edit-place-form";
import { usePlaceMarking } from "@/hooks/use-place-marking";
import { useListState } from "@/hooks/use-list-state";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { applyDeletedFilter, applyNameSearch } from "@/lib/query-builder";
import { softDelete, restoreDeleted } from "@/lib/soft-delete";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorCard } from "@/components/common/error-card";
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
}

const PlacesList = ({ refreshTrigger, searchQuery: externalSearchQuery, showDeleted: externalShowDeleted, onSearchStateChange }: PlacesListProps = {}) => {
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
    externalShowDeleted,
    refreshTrigger,
    onSearchStateChange,
  });

  const [places, setPlaces] = useState<Place[]>([]);
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const { generateMarking } = usePlaceMarking();

  const loadPlaces = async (query?: string, isInitialLoad = false) => {
    if (!user) return;

    startLoading(isInitialLoad);

    try {
      const supabase = createClient();
      let queryBuilder = supabase
        .from("places")
        .select("id, name, entity_type_id, marking_number, created_at, deleted_at, photo_url, entity_types!inner(code, name)")
        .order("created_at", { ascending: false });

      queryBuilder = applyDeletedFilter(queryBuilder, showDeleted);

      if (query && query.trim()) {
        const searchTerm = query.trim();
        const searchNumber = isNaN(Number(searchTerm)) ? null : Number(searchTerm);
        
        // Поиск по коду типа через JOIN требует отдельной логики
        // Сначала получаем типы, которые подходят по коду или названию
        const { data: matchingTypes } = await supabase
          .from("entity_types")
          .select("id")
          .eq("entity_category", "place")
          .is("deleted_at", null)
          .or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
        
        const matchingTypeIds = matchingTypes?.map(t => t.id) || [];
        
        if (matchingTypeIds.length > 0) {
          if (searchNumber !== null) {
            queryBuilder = queryBuilder.or(
              `name.ilike.%${searchTerm}%,marking_number.eq.${searchNumber}`
            ).in("entity_type_id", matchingTypeIds);
          } else {
            queryBuilder = queryBuilder
              .ilike("name", `%${searchTerm}%`)
              .in("entity_type_id", matchingTypeIds);
          }
        } else {
          if (searchNumber !== null) {
            queryBuilder = queryBuilder.or(
              `name.ilike.%${searchTerm}%,marking_number.eq.${searchNumber}`
            );
          } else {
            queryBuilder = queryBuilder.ilike("name", `%${searchTerm}%`);
          }
        }
      }

      const { data: placesData, error: fetchError } = await queryBuilder;

      if (fetchError) {
        throw fetchError;
      }

      if (!placesData || placesData.length === 0) {
        setPlaces([]);
        finishLoading(isInitialLoad, 0);
        return;
      }

      // Загружаем transitions для мест, чтобы узнать в каких помещениях они находятся
      const placeIds = placesData.map((place) => place.id);
      const { data: transitionsData } = await supabase
        .from("transitions")
        .select("*")
        .eq("destination_type", "room")
        .in("place_id", placeIds)
        .order("created_at", { ascending: false });

      // Группируем transitions по place_id и находим последний для каждого
      const lastTransitionsByPlace = new Map<number, any>();
      (transitionsData || []).forEach((transition) => {
        if (transition.place_id && !lastTransitionsByPlace.has(transition.place_id)) {
          lastTransitionsByPlace.set(transition.place_id, transition);
        }
      });

      // Получаем названия помещений
      const roomIds = Array.from(lastTransitionsByPlace.values())
        .map((t) => t.destination_id)
        .filter((id) => id !== null);

      const { data: roomsData } = roomIds.length > 0
        ? await supabase
            .from("rooms")
            .select("id, name")
            .in("id", roomIds)
            .is("deleted_at", null)
        : { data: [] };

      const roomsMap = new Map(
        (roomsData || []).map((r) => [r.id, r.name])
      );

      // Объединяем данные
      const placesWithRooms = placesData.map((place: any) => {
        const transition = lastTransitionsByPlace.get(place.id);
        
        return {
          id: place.id,
          name: place.name,
          entity_type_id: place.entity_type_id || null,
          entity_type: place.entity_types ? {
            code: place.entity_types.code,
            name: place.entity_types.name,
          } : null,
          marking_number: place.marking_number ?? null,
          created_at: place.created_at,
          deleted_at: place.deleted_at,
          photo_url: place.photo_url,
          room: transition
            ? {
                room_id: transition.destination_id,
                room_name: roomsMap.get(transition.destination_id) || null,
              }
            : null,
        };
      });

      setPlaces(placesWithRooms);
      finishLoading(isInitialLoad, placesWithRooms.length);
    } catch (err) {
      handleError(err, isInitialLoad);
      setPlaces([]);
    }
  };

  useEffect(() => {
    if (user && !isUserLoading) {
      loadPlaces(searchQuery, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showDeleted, refreshTrigger]);

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
      await softDelete("places", placeId);
      toast.success("Место успешно удалено");
      loadPlaces(searchQuery, false);
    } catch (err) {
      console.error("Ошибка при удалении места:", err);
      toast.error("Произошла ошибка при удалении места");
    }
  };

  const handleRestorePlace = async (placeId: number) => {
    try {
      await restoreDeleted("places", placeId);
      toast.success("Место успешно восстановлено");
      loadPlaces(searchQuery, false);
    } catch (err) {
      console.error("Ошибка при восстановлении места:", err);
      toast.error("Произошла ошибка при восстановлении места");
    }
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="space-y-6">
        <ListSkeleton variant="grid" rows={6} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ErrorCard message={error || ""} />

      {isSearching && places.length === 0 ? (
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
                      <CardTitle className="text-lg truncate">
                        {place.name || `Место #${place.id}`}
                      </CardTitle>
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
                {place.room?.room_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {place.room.room_name}
                    </span>
                  </div>
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
                <div className="flex items-center justify-end gap-2">
                  {!place.deleted_at ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlaceId(place.id)}
                        className="h-8 px-3"
                      >
                        <Pencil className="h-4 w-4 mr-1.5" />
                        <span className="text-xs">Изменить</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlace(place.id)}
                        className="h-8 px-3 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        <span className="text-xs">Удалить</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestorePlace(place.id)}
                      className="h-8 px-3 text-green-600 hover:text-green-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      <span className="text-xs">Восстановить</span>
                    </Button>
                  )}
                </div>
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
          currentRoomId={places.find((p) => p.id === editingPlaceId)?.room?.room_id || null}
          open={!!editingPlaceId}
          onOpenChange={(open) => !open && setEditingPlaceId(null)}
          onSuccess={() => {
            setEditingPlaceId(null);
            loadPlaces(searchQuery, false);
          }}
        />
      )}
    </div>
  );
};

export default PlacesList;
