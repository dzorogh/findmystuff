"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Container, MapPin, Building2, Calendar } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useContainerMarking } from "@/hooks/use-container-marking";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transition {
  id: number;
  created_at: string;
  destination_type: string | null;
  destination_id: number | null;
  destination_name?: string | null;
  place_name?: string | null;
  room_name?: string | null;
}

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

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const containerId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { generateMarking } = useContainerMarking();
  const [container, setContainer] = useState<Container | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (user && !isUserLoading) {
      loadContainerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isUserLoading, containerId]);

  const loadContainerData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Загружаем контейнер
      const { data: containerData, error: containerError } = await supabase
        .from("containers")
        .select("id, name, container_type, marking_number, created_at, deleted_at")
        .eq("id", containerId)
        .single();

      if (containerError) {
        throw containerError;
      }

      if (!containerData) {
        setError("Контейнер не найден");
        setIsLoading(false);
        return;
      }

      // Загружаем все transitions для этого контейнера
      const { data: transitionsData, error: transitionsError } = await supabase
        .from("transitions")
        .select("*")
        .eq("container_id", containerId)
        .order("created_at", { ascending: false });

      if (transitionsError) {
        throw transitionsError;
      }

      // Загружаем названия мест назначения
      const placeIds = (transitionsData || [])
        .filter((t) => t.destination_type === "place" && t.destination_id)
        .map((t) => t.destination_id);
      const containerIds = (transitionsData || [])
        .filter((t) => t.destination_type === "container" && t.destination_id)
        .map((t) => t.destination_id);
      const roomIds = (transitionsData || [])
        .filter((t) => t.destination_type === "room" && t.destination_id)
        .map((t) => t.destination_id);

      const [placesData, containersData, roomsData] = await Promise.all([
        placeIds.length > 0
          ? supabase
              .from("places")
              .select("id, name")
              .in("id", placeIds)
              .is("deleted_at", null)
          : { data: [] },
        containerIds.length > 0
          ? supabase
              .from("containers")
              .select("id, name")
              .in("id", containerIds)
              .is("deleted_at", null)
          : { data: [] },
        roomIds.length > 0
          ? supabase
              .from("rooms")
              .select("id, name")
              .in("id", roomIds)
              .is("deleted_at", null)
          : { data: [] },
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

      // Для мест получаем их помещения
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

      // Для контейнеров получаем их местоположения
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

      // Формируем transitions с названиями
      const transitionsWithNames: Transition[] = (transitionsData || []).map((t) => {
        const transition: Transition = {
          id: t.id,
          created_at: t.created_at,
          destination_type: t.destination_type,
          destination_id: t.destination_id,
        };

        if (t.destination_type === "place" && t.destination_id) {
          transition.destination_name = placesMap.get(t.destination_id) || null;
          const placeTransition = lastPlaceTransitions.get(t.destination_id);
          if (placeTransition?.destination_id) {
            transition.room_name = placeRoomsMap.get(placeTransition.destination_id) || null;
          }
        } else if (t.destination_type === "container" && t.destination_id) {
          transition.destination_name = containersMap.get(t.destination_id) || null;
          const containerTransition = lastContainerTransitions.get(t.destination_id);
          if (containerTransition) {
            if (containerTransition.destination_type === "place" && containerTransition.destination_id) {
              const placeName = placesMap.get(containerTransition.destination_id);
              transition.place_name = placeName || null;
              const placeTransition = lastPlaceTransitions.get(containerTransition.destination_id);
              if (placeTransition?.destination_id) {
                transition.room_name = placeRoomsMap.get(placeTransition.destination_id) || null;
              }
            } else if (containerTransition.destination_type === "room" && containerTransition.destination_id) {
              transition.room_name = roomsMap.get(containerTransition.destination_id) || null;
            }
          }
        } else if (t.destination_type === "room" && t.destination_id) {
          transition.destination_name = roomsMap.get(t.destination_id) || null;
        }

        return transition;
      });

      // Определяем последнее местоположение
      const lastTransition = transitionsWithNames[0];
      const lastLocation = lastTransition
        ? {
            destination_type: lastTransition.destination_type,
            destination_id: lastTransition.destination_id,
            destination_name: lastTransition.destination_name || null,
            moved_at: lastTransition.created_at,
          }
        : null;

      setContainer({
        ...containerData,
        last_location: lastLocation,
      });
      setTransitions(transitionsWithNames);
    } catch (err) {
      console.error("Ошибка загрузки данных контейнера:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-10 w-32" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !container) {
    return (
      <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <Button variant="ghost" onClick={() => router.push("/containers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error || "Контейнер не найден"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => router.push("/containers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Container className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">
                    {container.name || `Контейнер #${container.id}`}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
                    {generateMarking(container.container_type as any, container.marking_number) ? (
                      <>
                        <span className="font-mono font-semibold">
                          {generateMarking(container.container_type as any, container.marking_number)}
                        </span>
                        <span className="text-muted-foreground">•</span>
                      </>
                    ) : null}
                    <span>ID: #{container.id}</span>
                    {container.deleted_at && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="destructive">
                          Удалено
                        </Badge>
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Текущее местоположение</h3>
              {container.last_location ? (
                <div className="space-y-2">
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Перемещен:{" "}
                    {new Date(container.last_location.moved_at).toLocaleString("ru-RU", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Местоположение не указано</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Создан:{" "}
                {new Date(container.created_at).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История перемещений</CardTitle>
            <CardDescription>
              Все перемещения этого контейнера в хронологическом порядке
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transitions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                История перемещений пуста
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата и время</TableHead>
                    <TableHead>Местоположение</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transitions.map((transition, index) => (
                    <TableRow key={transition.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(transition.created_at).toLocaleString("ru-RU", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {index === 0 && (
                            <Badge variant="default" className="ml-2">
                              Текущее
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {transition.destination_type === "room" && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                              <span>
                                {transition.destination_name ||
                                  `Помещение #${transition.destination_id}`}
                              </span>
                            </div>
                          )}
                          {transition.destination_type === "place" && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {transition.destination_name ||
                                    `Место #${transition.destination_id}`}
                                </span>
                              </div>
                              {transition.room_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                                  <Building2 className="h-3 w-3 flex-shrink-0" />
                                  <span>{transition.room_name}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {transition.destination_type === "container" && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Container className="h-4 w-4 text-primary flex-shrink-0" />
                                <span>
                                  {transition.destination_name ||
                                    `Контейнер #${transition.destination_id}`}
                                </span>
                              </div>
                              {transition.place_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span>{transition.place_name}</span>
                                </div>
                              )}
                              {transition.room_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                                  <Building2 className="h-3 w-3 flex-shrink-0" />
                                  <span>{transition.room_name}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {!transition.destination_type && (
                            <span className="text-sm text-muted-foreground">
                              Местоположение не указано
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
