"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, MapPin, Building2, Pencil, Trash2, RotateCcw } from "lucide-react";
import { SearchForm } from "@/components/common/search-form";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import EditContainerForm from "@/components/forms/edit-container-form";
import { useContainerMarking } from "@/hooks/use-container-marking";
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
  photo_url: string | null;
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
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [containers, setContainers] = useState<Container[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingContainerId, setEditingContainerId] = useState<number | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const { generateMarking } = useContainerMarking();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadContainers(undefined, true);
    }
  }, [user, refreshTrigger, showDeleted]);

  const loadContainers = async (query?: string, isInitialLoad = false) => {
    if (!user) return;

    setIsSearching(true);
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const supabase = createClient();
      let queryBuilder = supabase
        .from("containers")
        .select("id, name, container_type, marking_number, created_at, deleted_at, photo_url")
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
        if (isInitialLoad) {
          setIsLoading(false);
        }
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
            photo_url: container.photo_url,
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
          photo_url: container.photo_url,
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
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!value.trim()) {
      // При очистке поля не показываем полную загрузку, чтобы не терять фокус
      const timer = setTimeout(() => {
        loadContainers(undefined, false);
      }, 300);
      setDebounceTimer(timer);
      return;
    }

    const timer = setTimeout(() => {
      loadContainers(value, false);
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
      loadContainers(searchQuery, false);
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
      loadContainers(searchQuery, false);
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

  if (isLoading || isUserLoading) {
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
    return null;
  }

  return (
    <div className="space-y-6">
      <SearchForm
        title="Поиск контейнеров"
        description="Поиск по названию, типу контейнера или маркировке (например, КОР-001)"
        placeholder="Название, тип или маркировка (КОР-001)..."
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        isSearching={isSearching}
        resultsCount={containers.length}
        resultsLabel={{ singular: "контейнер", plural: "контейнеров" }}
        showDeleted={showDeleted}
        onToggleDeleted={() => setShowDeleted(!showDeleted)}
      />

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
                    <TableHead className="w-[150px] text-right">Действия</TableHead>
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
                          {container.photo_url ? (
                            <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden border border-border bg-muted">
                              <Image
                                src={container.photo_url}
                                alt={container.name || `Контейнер #${container.id}`}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized={container.photo_url.includes("storage.supabase.co")}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                              <Container className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/containers/${container.id}`}
                              className="font-medium hover:underline break-words leading-tight block"
                            >
                              {container.name || `Контейнер #${container.id}`}
                            </Link>
                            {generateMarking(container.container_type as any, container.marking_number) && (
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                {generateMarking(container.container_type as any, container.marking_number)}
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
            loadContainers(searchQuery, false);
          }}
        />
      )}
    </div>
  );
};

export default ContainersList;
