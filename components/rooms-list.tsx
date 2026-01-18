"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Building2, Loader2, Pencil, MapPin, Container, Package, Trash2, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EditRoomForm from "./edit-room-form";

interface Room {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at: string | null;
  items_count?: number;
  places_count?: number;
  containers_count?: number;
}

interface RoomsListProps {
  refreshTrigger?: number;
}

const RoomsList = ({ refreshTrigger }: RoomsListProps = {}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

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
      loadRooms();
    }
  }, [user, refreshTrigger, showDeleted]);

  const loadRooms = async (query?: string) => {
    if (!user) return;

    setIsSearching(true);
    setError(null);

    try {
      const supabase = createClient();
      let queryBuilder = supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

      // Фильтр по удаленным
      if (!showDeleted) {
        queryBuilder = queryBuilder.is("deleted_at", null);
      } else {
        queryBuilder = queryBuilder.not("deleted_at", "is", null);
      }

      if (query && query.trim()) {
        const searchTerm = query.trim();
        queryBuilder = queryBuilder.ilike("name", `%${searchTerm}%`);
      }

      const { data: roomsData, error: fetchError } = await queryBuilder;

      if (fetchError) {
        throw fetchError;
      }

      if (!roomsData || roomsData.length === 0) {
        setRooms([]);
        setIsSearching(false);
        return;
      }

      // Подсчитываем количество вещей, мест и контейнеров в каждом помещении
      const roomIds = roomsData.map((room) => room.id);
      
      // Получаем все transitions с room как destination
      const { data: allTransitions } = await supabase
        .from("transitions")
        .select("*")
        .eq("destination_type", "room")
        .in("destination_id", roomIds);

      // Подсчитываем уникальные item_id для вещей
      const itemsByRoom = new Map<number, Set<number>>();
      const placesByRoom = new Map<number, Set<number>>();
      const containersByRoom = new Map<number, Set<number>>();

      (allTransitions || []).forEach((t) => {
        const roomId = t.destination_id;
        
        if (t.item_id) {
          if (!itemsByRoom.has(roomId)) {
            itemsByRoom.set(roomId, new Set());
          }
          itemsByRoom.get(roomId)?.add(t.item_id);
        }
        
        if (t.place_id) {
          if (!placesByRoom.has(roomId)) {
            placesByRoom.set(roomId, new Set());
          }
          placesByRoom.get(roomId)?.add(t.place_id);
        }
        
        if (t.container_id) {
          if (!containersByRoom.has(roomId)) {
            containersByRoom.set(roomId, new Set());
          }
          containersByRoom.get(roomId)?.add(t.container_id);
        }
      });

      const roomsWithCounts = roomsData.map((room) => {
        return {
          ...room,
          items_count: itemsByRoom.get(room.id)?.size || 0,
          places_count: placesByRoom.get(room.id)?.size || 0,
          containers_count: containersByRoom.get(room.id)?.size || 0,
        };
      });

      setRooms(roomsWithCounts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при загрузке помещений"
      );
      setRooms([]);
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
      loadRooms();
      return;
    }

    const timer = setTimeout(() => {
      loadRooms(value);
    }, 300);

    setDebounceTimer(timer);
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm("Вы уверены, что хотите удалить это помещение?")) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("rooms")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", roomId);

      if (error) throw error;
      loadRooms(searchQuery);
    } catch (err) {
      console.error("Ошибка при удалении помещения:", err);
      alert("Произошла ошибка при удалении помещения");
    }
  };

  const handleRestoreRoom = async (roomId: number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("rooms")
        .update({ deleted_at: null })
        .eq("id", roomId);

      if (error) throw error;
      loadRooms(searchQuery);
    } catch (err) {
      console.error("Ошибка при восстановлении помещения:", err);
      alert("Произошла ошибка при восстановлении помещения");
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
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
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
            Пожалуйста, авторизуйтесь для просмотра помещений.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (user.email !== "dzorogh@gmail.com") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            У вас нет прав для просмотра помещений.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Поиск помещений</CardTitle>
          <CardDescription>
            Введите название для поиска по всем помещениям
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Введите название помещения..."
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
                Найдено: {rooms.length}{" "}
                {rooms.length === 1 ? "помещение" : "помещений"}
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

      {isSearching && rooms.length === 0 ? (
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
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "По вашему запросу ничего не найдено"
                : "Помещения не найдены"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className={room.deleted_at ? "opacity-60 border-destructive/50" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">
                      {room.name || `Помещение #${room.id}`}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.deleted_at && (
                      <Badge variant="destructive">Удалено</Badge>
                    )}
                    <Badge variant="secondary">#{room.id}</Badge>
                    {user.email === "dzorogh@gmail.com" && (
                      <>
                        {!room.deleted_at ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingRoomId(room.id)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRoom(room.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestoreRoom(room.id)}
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
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
            </Card>
          ))}
        </div>
      )}

      {editingRoomId && (
        <EditRoomForm
          roomId={editingRoomId}
          roomName={rooms.find((r) => r.id === editingRoomId)?.name || null}
          open={!!editingRoomId}
          onOpenChange={(open) => !open && setEditingRoomId(null)}
          onSuccess={() => {
            setEditingRoomId(null);
            loadRooms(searchQuery);
          }}
        />
      )}
    </div>
  );
};

export default RoomsList;
