"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, MapPin, Container, Building2, Calendar, Pencil } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import EditItemForm from "@/components/edit-item-form";
import MoveItemForm from "@/components/move-item-form";
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

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const [item, setItem] = useState<Item | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (user && !isUserLoading) {
      loadItemData();
    }
  }, [user, isUserLoading, itemId]);

  const loadItemData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Загружаем вещь
      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .select("id, name, created_at, deleted_at, photo_url")
        .eq("id", itemId)
        .single();

      if (itemError) {
        throw itemError;
      }

      if (!itemData) {
        setError("Вещь не найдена");
        setIsLoading(false);
        return;
      }

      // Загружаем все transitions для этой вещи
      const { data: transitionsData, error: transitionsError } = await supabase
        .from("transitions")
        .select("*")
        .eq("item_id", itemId)
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
            destination_name: lastTransition.destination_name ?? null,
            moved_at: lastTransition.created_at,
            place_name: lastTransition.place_name ?? null,
            room_name: lastTransition.room_name ?? null,
          }
        : null;

      setItem({
        ...itemData,
        last_location: lastLocation,
      });
      setTransitions(transitionsWithNames);
    } catch (err) {
      console.error("Ошибка загрузки данных вещи:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
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

  if (error || !item) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <Button variant="ghost" onClick={() => router.push("/items")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error || "Вещь не найдена"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => router.push("/items")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {item.photo_url ? (
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                    <Image
                      src={item.photo_url}
                      alt={item.name || `Вещь #${item.id}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  </div>
                ) : (
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl sm:text-2xl break-words">
                    {item.name || `Вещь #${item.id}`}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    ID: #{item.id}
                    {item.deleted_at && (
                      <Badge variant="destructive" className="ml-2">
                        Удалено
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              {user.email === "dzorogh@gmail.com" && !item.deleted_at && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Редактировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMoveDialogOpen(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Переместить
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.photo_url && (
              <div className="w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                <Image
                  src={item.photo_url}
                  alt={item.name || `Вещь #${item.id}`}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium mb-2">Текущее местоположение</h3>
              {item.last_location ? (
                <div className="space-y-2">
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Перемещено:{" "}
                    {new Date(item.last_location.moved_at).toLocaleString("ru-RU", {
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
                Создано:{" "}
                {new Date(item.created_at).toLocaleDateString("ru-RU", {
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
              Все перемещения этой вещи в хронологическом порядке
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

        {isEditDialogOpen && item && (
          <EditItemForm
            itemId={item.id}
            itemName={item.name}
            currentLocation={item.last_location}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              loadItemData();
            }}
          />
        )}

        {isMoveDialogOpen && item && (
          <MoveItemForm
            itemId={item.id}
            itemName={item.name}
            open={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
            onSuccess={() => {
              setIsMoveDialogOpen(false);
              loadItemData();
            }}
          />
        )}
      </div>
    </div>
  );
}
