"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building2, Loader2, Pencil, Trash2, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EditPlaceForm from "./edit-place-form";
import { usePlaceMarking } from "@/hooks/use-place-marking";
import { useAdmin } from "@/hooks/use-admin";

interface Place {
  id: number;
  name: string | null;
  place_type: string | null;
  marking_number: number | null;
  created_at: string;
  deleted_at: string | null;
  room?: {
    room_id: number | null;
    room_name: string | null;
  } | null;
}

interface PlacesListProps {
  refreshTrigger?: number;
}

const PlacesList = ({ refreshTrigger }: PlacesListProps = {}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const { generateMarking } = usePlaceMarking();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadPlaces();
    }
  }, [user, refreshTrigger, showDeleted]);

  const loadPlaces = async (query?: string) => {
    if (!user) return;

    setIsSearching(true);
    setError(null);

    try {
      const supabase = createClient();
      let queryBuilder = supabase
        .from("places")
        .select("id, name, place_type, marking_number, created_at, deleted_at")
        .order("created_at", { ascending: false });

      // Фильтр по удаленным
      if (!showDeleted) {
        queryBuilder = queryBuilder.is("deleted_at", null);
      } else {
        queryBuilder = queryBuilder.not("deleted_at", "is", null);
      }

      if (query && query.trim()) {
        const searchTerm = query.trim();
        // Поиск по названию, типу места или номеру маркировки
        const searchNumber = isNaN(Number(searchTerm)) ? null : Number(searchTerm);
        if (searchNumber !== null) {
          queryBuilder = queryBuilder.or(
            `name.ilike.%${searchTerm}%,place_type.ilike.%${searchTerm}%,marking_number.eq.${searchNumber}`
          );
        } else {
          queryBuilder = queryBuilder.or(
            `name.ilike.%${searchTerm}%,place_type.ilike.%${searchTerm}%`
          );
        }
      }

      const { data: placesData, error: fetchError } = await queryBuilder;

      if (fetchError) {
        throw fetchError;
      }

      if (!placesData || placesData.length === 0) {
        setPlaces([]);
        setIsSearching(false);
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
          place_type: place.place_type || null,
          marking_number: place.marking_number ?? null,
          created_at: place.created_at,
          deleted_at: place.deleted_at,
          room: transition
            ? {
                room_id: transition.destination_id,
                room_name: roomsMap.get(transition.destination_id) || null,
              }
            : null,
        };
      });

      setPlaces(placesWithRooms);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при загрузке местоположений"
      );
      setPlaces([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!value.trim()) {
      loadPlaces();
      return;
    }

    const timer = setTimeout(() => {
      loadPlaces(value);
    }, 300);

    setDebounceTimer(timer);
  };

  const handleDeletePlace = async (placeId: number) => {
    if (!confirm("Вы уверены, что хотите удалить это место?")) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("places")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", placeId);

      if (error) throw error;
      loadPlaces(searchQuery);
    } catch (err) {
      console.error("Ошибка при удалении места:", err);
      alert("Произошла ошибка при удалении места");
    }
  };

  const handleRestorePlace = async (placeId: number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("places")
        .update({ deleted_at: null })
        .eq("id", placeId);

      if (error) throw error;
      loadPlaces(searchQuery);
    } catch (err) {
      console.error("Ошибка при восстановлении места:", err);
      alert("Произошла ошибка при восстановлении места");
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Пожалуйста, авторизуйтесь для просмотра местоположений.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            У вас нет прав для просмотра местоположений.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Поиск местоположений</CardTitle>
          <CardDescription>
            Поиск по названию, типу места или маркировке (например, Ш1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Название, тип или маркировка (Ш1)..."
              className="pl-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Найдено: {places.length}{" "}
                {places.length === 1 ? "место" : "мест"}
              </p>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant={showDeleted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
                className="flex-1 sm:flex-initial"
              >
                {showDeleted ? "Скрыть удаленные" : "Показать удаленные"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {isSearching && places.length === 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : places.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "По вашему запросу ничего не найдено"
                : "Местоположения не найдены"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Card key={place.id} className={place.deleted_at ? "opacity-60 border-destructive/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">
                        {place.name || `Место #${place.id}`}
                      </CardTitle>
                      {place.place_type && place.marking_number != null && (
                        <p className="text-sm font-semibold font-mono text-primary mt-0.5">
                          {generateMarking(place.place_type, place.marking_number) || `${place.place_type}${place.marking_number}`}
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
              {isAdmin && (
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
              )}
            </Card>
          ))}
        </div>
      )}

      {editingPlaceId && (
        <EditPlaceForm
          placeId={editingPlaceId}
          placeName={places.find((p) => p.id === editingPlaceId)?.name || null}
          placeType={places.find((p) => p.id === editingPlaceId)?.place_type || null}
          markingNumber={places.find((p) => p.id === editingPlaceId)?.marking_number || null}
          currentRoomId={places.find((p) => p.id === editingPlaceId)?.room?.room_id || null}
          open={!!editingPlaceId}
          onOpenChange={(open) => !open && setEditingPlaceId(null)}
          onSuccess={() => {
            setEditingPlaceId(null);
            loadPlaces(searchQuery);
          }}
        />
      )}
    </div>
  );
};

export default PlacesList;
