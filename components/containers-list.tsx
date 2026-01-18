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
import { generateContainerMarking } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Container {
  id: number;
  name: string | null;
  container_type: string | null;
  marking_number: number | null;
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
        .select("id, name, container_type, marking_number, created_at, deleted_at")
        .order("created_at", { ascending: false });

      // Фильтр по удаленным
      if (!showDeleted) {
        queryBuilder = queryBuilder.is("deleted_at", null);
      } else {
        queryBuilder = queryBuilder.not("deleted_at", "is", null);
      }

      if (query && query.trim()) {
        const searchTerm = query.trim();
        // Проверяем, является ли запрос маркировкой в формате ТИП-НОМЕР
        const markingMatch = searchTerm.match(/^([А-ЯЁ]+)-?(\d+)$/i);
        
        if (markingMatch) {
          // Если это маркировка, ищем по типу и номеру
          const [, type, number] = markingMatch;
          queryBuilder = queryBuilder
            .ilike("container_type", `%${type.toUpperCase()}%`)
            .eq("marking_number", parseInt(number));
        } else {
          // Обычный поиск по названию, типу или номеру
          const searchNumber = isNaN(Number(searchTerm)) ? null : Number(searchTerm);
          if (searchNumber !== null) {
            queryBuilder = queryBuilder.or(
              `name.ilike.%${searchTerm}%,container_type.ilike.%${searchTerm}%,marking_number.eq.${searchNumber}`
            );
          } else {
            queryBuilder = queryBuilder.or(
              `name.ilike.%${searchTerm}%,container_type.ilike.%${searchTerm}%`
            );
          }
        }
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
            container_type: container.container_type,
            marking_number: container.marking_number,
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
          container_type: container.container_type,
          marking_number: container.marking_number,
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"><Skeleton className="h-4 w-8" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                  <TableHead className="w-[120px]"><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead className="w-[150px]"><Skeleton className="h-4 w-16" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
            Поиск по названию, типу контейнера или маркировке (например, КОР-001)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Название, тип или маркировка (КОР-001)..."
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"><Skeleton className="h-4 w-8" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                  <TableHead className="w-[120px]"><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead className="w-[150px]"><Skeleton className="h-4 w-16" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] hidden sm:table-cell">ID</TableHead>
                    <TableHead>Маркировка / Название</TableHead>
                    <TableHead className="hidden md:table-cell">Местоположение</TableHead>
                    <TableHead className="w-[120px] hidden lg:table-cell">Дата перемещения</TableHead>
                    {user.email === "dzorogh@gmail.com" && (
                      <TableHead className="w-[150px] text-right">Действия</TableHead>
                    )}
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
                          <Container className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/containers/${container.id}`}
                              className="font-medium hover:underline break-words leading-tight block"
                            >
                              {container.name || `Контейнер #${container.id}`}
                            </Link>
                            {generateContainerMarking(container.container_type as any, container.marking_number) && (
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                {generateContainerMarking(container.container_type as any, container.marking_number)}
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
                      {user.email === "dzorogh@gmail.com" && (
                        <TableCell>
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            {!container.deleted_at ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingContainerId(container.id)}
                                  className="h-8 w-8"
                                  title="Редактировать"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteContainer(container.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Удалить"
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
                                title="Восстановить"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
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
          containerType={containers.find((c) => c.id === editingContainerId)?.container_type as any || null}
          markingNumber={containers.find((c) => c.id === editingContainerId)?.marking_number || null}
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
