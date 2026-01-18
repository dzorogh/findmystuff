"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Container, Loader2, MapPin, Building2, Pencil, Trash2, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import EditContainerForm from "./edit-container-form";

interface Container {
  id: number;
  name: string | null;
  created_at: string;
  deleted_at: string | null;
  last_location?: {
    destination_type: string | null;
    destination_id: number | null;
    destination_name: string | null;
    moved_at: string;
  } | null;
}

interface ContainersListProps {
  refreshTrigger?: number;
}

const ContainersList = ({ refreshTrigger }: ContainersListProps = {}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [containers, setContainers] = useState<Container[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingContainerId, setEditingContainerId] = useState<number | null>(null);
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
      loadContainers();
    }
  }, [user, refreshTrigger, showDeleted]);

  const loadContainers = async (query?: string) => {
    if (!user) return;

    setIsSearching(true);
    setError(null);

    try {
      const supabase = createClient();
      let queryBuilder = supabase
        .from("containers")
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

      const { data: containersData, error: fetchError } = await queryBuilder;

      if (fetchError) {
        throw fetchError;
      }

      if (!containersData || containersData.length === 0) {
        setContainers([]);
        setIsSearching(false);
        return;
      }

      // Загружаем transitions для контейнеров
      const containerIds = containersData.map((container) => container.id);
      const { data: transitionsData, error: transitionsError } = await supabase
        .from("transitions")
        .select("*")
        .in("container_id", containerIds)
        .order("created_at", { ascending: false });

      if (transitionsError) {
        throw transitionsError;
      }

      // Группируем transitions по container_id и находим последний для каждого
      const lastTransitionsByContainer = new Map<number, any>();
      (transitionsData || []).forEach((transition) => {
        if (!lastTransitionsByContainer.has(transition.container_id)) {
          lastTransitionsByContainer.set(transition.container_id, transition);
        }
      });

      // Загружаем все места и контейнеры одним запросом
      const placeIds = Array.from(lastTransitionsByContainer.values())
        .filter((t) => t.destination_type === "place" && t.destination_id)
        .map((t) => t.destination_id);

      const containerDestinationIds = Array.from(lastTransitionsByContainer.values())
        .filter((t) => t.destination_type === "container" && t.destination_id)
        .map((t) => t.destination_id);

      const roomIds = Array.from(lastTransitionsByContainer.values())
        .filter((t) => t.destination_type === "room" && t.destination_id)
        .map((t) => t.destination_id);

      const [placesData, containersDestData, roomsData] = await Promise.all([
        placeIds.length > 0
          ? supabase
              .from("places")
              .select("id, name")
              .in("id", placeIds)
              .is("deleted_at", null)
          : { data: [], error: null },
        containerDestinationIds.length > 0
          ? supabase
              .from("containers")
              .select("id, name")
              .in("id", containerDestinationIds)
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

      // Создаем мапы для быстрого поиска
      const placesMap = new Map(
        (placesData.data || []).map((p) => [p.id, p.name])
      );
      const containersMap = new Map(
        (containersDestData.data || []).map((c) => [c.id, c.name])
      );
      const roomsMap = new Map(
        (roomsData.data || []).map((r) => [r.id, r.name])
      );

      // Объединяем данные
      const containersWithLocation = containersData.map((container: any) => {
        const lastTransition = lastTransitionsByContainer.get(container.id);

        if (!lastTransition) {
          return {
            id: container.id,
            name: container.name,
            created_at: container.created_at,
            deleted_at: container.deleted_at,
            last_location: null,
          };
        }

        const destinationName =
          lastTransition.destination_type === "place"
            ? placesMap.get(lastTransition.destination_id) || null
            : lastTransition.destination_type === "container"
            ? containersMap.get(lastTransition.destination_id) || null
            : lastTransition.destination_type === "room"
            ? roomsMap.get(lastTransition.destination_id) || null
            : null;

        return {
          id: container.id,
          name: container.name,
          created_at: container.created_at,
          deleted_at: container.deleted_at,
          last_location: {
            destination_type: lastTransition.destination_type,
            destination_id: lastTransition.destination_id,
            destination_name: destinationName,
            moved_at: lastTransition.created_at,
          },
        };
      });

      setContainers(containersWithLocation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при загрузке контейнеров"
      );
      setContainers([]);
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
      loadContainers();
      return;
    }

    const timer = setTimeout(() => {
      loadContainers(value);
    }, 300);

    setDebounceTimer(timer);
  };

  const handleDeleteContainer = async (containerId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот контейнер?")) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("containers")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", containerId);

      if (error) throw error;
      loadContainers(searchQuery);
    } catch (err) {
      console.error("Ошибка при удалении контейнера:", err);
      alert("Произошла ошибка при удалении контейнера");
    }
  };

  const handleRestoreContainer = async (containerId: number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("containers")
        .update({ deleted_at: null })
        .eq("id", containerId);

      if (error) throw error;
      loadContainers(searchQuery);
    } catch (err) {
      console.error("Ошибка при восстановлении контейнера:", err);
      alert("Произошла ошибка при восстановлении контейнера");
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
                <Skeleton className="h-4 w-full" />
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
            Пожалуйста, авторизуйтесь для просмотра контейнеров.
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
            У вас нет прав для просмотра контейнеров.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Поиск контейнеров</CardTitle>
          <CardDescription>
            Введите название для поиска по всем контейнерам
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Введите название контейнера..."
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
                Найдено: {containers.length}{" "}
                {containers.length === 1 ? "контейнер" : "контейнеров"}
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

      {isSearching && containers.length === 0 ? (
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
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : containers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Container className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "По вашему запросу ничего не найдено"
                : "Контейнеры не найдены"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {containers.map((container) => (
            <Card key={container.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Container className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">
                      <Link
                        href={`/containers/${container.id}`}
                        className="hover:underline"
                      >
                        {container.name || `Контейнер #${container.id}`}
                      </Link>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {container.deleted_at && (
                      <Badge variant="destructive">Удалено</Badge>
                    )}
                    <Badge variant="secondary">#{container.id}</Badge>
                    {user.email === "dzorogh@gmail.com" && (
                      <>
                        {!container.deleted_at ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingContainerId(container.id)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteContainer(container.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestoreContainer(container.id)}
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
                {container.last_location ? (
                  <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          {container.last_location.destination_type === "place" ? (
                            <MapPin className="h-4 w-4 text-primary" />
                          ) : container.last_location.destination_type === "container" ? (
                            <Container className="h-4 w-4 text-primary" />
                          ) : (
                            <Building2 className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-medium">
                            {container.last_location.destination_name ||
                              `#${container.last_location.destination_id}`}
                          </span>
                        </div>
                    <p className="text-xs text-muted-foreground">
                      Размещен:{" "}
                      {new Date(container.last_location.moved_at).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">
                      Местоположение не указано
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Создан:{" "}
                  {new Date(container.created_at).toLocaleDateString("ru-RU", {
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

      {editingContainerId && (
        <EditContainerForm
          containerId={editingContainerId}
          containerName={containers.find((c) => c.id === editingContainerId)?.name || null}
          currentLocation={containers.find((c) => c.id === editingContainerId)?.last_location}
          open={!!editingContainerId}
          onOpenChange={(open) => !open && setEditingContainerId(null)}
          onSuccess={() => {
            setEditingContainerId(null);
            loadContainers(searchQuery);
          }}
        />
      )}
    </div>
  );
};

export default ContainersList;
