"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Building2, Calendar, Pencil, ArrowRightLeft, Trash2, RotateCcw, Package, Container } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { usePlaceMarking } from "@/hooks/use-place-marking";
import { MarkingDisplay } from "@/components/common/marking-display";
import { toast } from "sonner";
import { softDelete, restoreDeleted } from "@/lib/soft-delete";
import EditPlaceForm from "@/components/forms/edit-place-form";
import MovePlaceForm from "@/components/forms/move-place-form";
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
}

interface Place {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  entity_type?: {
    code: string;
    name: string;
  } | null;
  marking_number: number | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
  last_location?: {
    destination_type: string | null;
    destination_id: number | null;
    destination_name: string | null;
    moved_at: string;
  } | null;
}

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { generateMarking } = usePlaceMarking();
  const [place, setPlace] = useState<Place | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [placeItems, setPlaceItems] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [placeContainers, setPlaceContainers] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (user && !isUserLoading) {
      loadPlaceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isUserLoading, placeId]);

  const loadPlaceData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Загружаем место
      const { data: placeData, error: placeError } = await supabase
        .from("places")
        .select("id, name, entity_type_id, marking_number, photo_url, created_at, deleted_at, entity_types(code, name)")
        .eq("id", placeId)
        .single();

      if (placeError) {
        throw placeError;
      }

      if (!placeData) {
        setError("Место не найдено");
        setIsLoading(false);
        return;
      }

      // Загружаем все transitions для этого места
      const { data: transitionsData, error: transitionsError } = await supabase
        .from("transitions")
        .select("*")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false });

      if (transitionsError) {
        throw transitionsError;
      }

      // Загружаем названия помещений
      const roomIds = (transitionsData || [])
        .filter((t) => t.destination_type === "room" && t.destination_id)
        .map((t) => t.destination_id);

      const roomsData = roomIds.length > 0
        ? await supabase
            .from("rooms")
            .select("id, name")
            .in("id", roomIds)
            .is("deleted_at", null)
        : { data: [] };

      const roomsMap = new Map(
        (roomsData.data || []).map((r) => [r.id, r.name])
      );

      // Формируем transitions с названиями
      const transitionsWithNames: Transition[] = (transitionsData || []).map((t) => {
        const transition: Transition = {
          id: t.id,
          created_at: t.created_at,
          destination_type: t.destination_type,
          destination_id: t.destination_id,
        };

        if (t.destination_type === "room" && t.destination_id) {
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

      let entityType: { code: string; name: string } | null = null;
      if (placeData.entity_types) {
        if (Array.isArray(placeData.entity_types) && placeData.entity_types.length > 0) {
          entityType = placeData.entity_types[0];
        } else if (!Array.isArray(placeData.entity_types)) {
          entityType = placeData.entity_types;
        }
      }

      setPlace({
        id: placeData.id,
        name: placeData.name,
        entity_type_id: placeData.entity_type_id || null,
        entity_type: entityType,
        marking_number: placeData.marking_number,
        photo_url: placeData.photo_url,
        created_at: placeData.created_at,
        deleted_at: placeData.deleted_at,
        last_location: lastLocation,
      });
      setTransitions(transitionsWithNames);

      // Загружаем вещи, которые находятся в этом месте
      const { data: itemsTransitionsData } = await supabase
        .from("transitions")
        .select("item_id, created_at")
        .eq("destination_type", "place")
        .eq("destination_id", placeId)
        .order("created_at", { ascending: false });

      if (itemsTransitionsData) {
        const itemTransitionsMap = new Map<number, any>();
        (itemsTransitionsData || []).forEach((t) => {
          if (t.item_id && !itemTransitionsMap.has(t.item_id)) {
            itemTransitionsMap.set(t.item_id, t);
          }
        });

        const itemIds = Array.from(itemTransitionsMap.keys());
        if (itemIds.length > 0) {
          const { data: allItemTransitionsData } = await supabase
            .from("transitions")
            .select("*")
            .in("item_id", itemIds)
            .order("created_at", { ascending: false });

          const lastItemTransitions = new Map<number, any>();
          (allItemTransitionsData || []).forEach((t) => {
            if (t.item_id && !lastItemTransitions.has(t.item_id)) {
              lastItemTransitions.set(t.item_id, t);
            }
          });

          const itemsInPlace = Array.from(lastItemTransitions.entries())
            .filter(([itemId, transition]) => 
              transition.destination_type === "place" && 
              transition.destination_id === placeId
            )
            .map(([itemId]) => itemId);

          if (itemsInPlace.length > 0) {
            const { data: itemsData } = await supabase
              .from("items")
              .select("id, name, photo_url, created_at")
              .in("id", itemsInPlace)
              .is("deleted_at", null)
              .order("created_at", { ascending: false });

            setPlaceItems(itemsData || []);
          } else {
            setPlaceItems([]);
          }
        } else {
          setPlaceItems([]);
        }
      }

      // Загружаем контейнеры, которые находятся в этом месте
      const { data: containersTransitionsData } = await supabase
        .from("transitions")
        .select("container_id, created_at")
        .eq("destination_type", "place")
        .eq("destination_id", placeId)
        .order("created_at", { ascending: false });

      if (containersTransitionsData) {
        const containerTransitionsMap = new Map<number, any>();
        (containersTransitionsData || []).forEach((t) => {
          if (t.container_id && !containerTransitionsMap.has(t.container_id)) {
            containerTransitionsMap.set(t.container_id, t);
          }
        });

        const containerIds = Array.from(containerTransitionsMap.keys());
        if (containerIds.length > 0) {
          const { data: allContainerTransitionsData } = await supabase
            .from("transitions")
            .select("*")
            .in("container_id", containerIds)
            .order("created_at", { ascending: false });

          const lastContainerTransitions = new Map<number, any>();
          (allContainerTransitionsData || []).forEach((t) => {
            if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
              lastContainerTransitions.set(t.container_id, t);
            }
          });

          const containersInPlace = Array.from(lastContainerTransitions.entries())
            .filter(([containerId, transition]) => 
              transition.destination_type === "place" && 
              transition.destination_id === placeId
            )
            .map(([containerId]) => containerId);

          if (containersInPlace.length > 0) {
            const { data: containersData } = await supabase
              .from("containers")
              .select("id, name, photo_url, created_at")
              .in("id", containersInPlace)
              .is("deleted_at", null)
              .order("created_at", { ascending: false });

            setPlaceContainers(containersData || []);
          } else {
            setPlaceContainers([]);
          }
        } else {
          setPlaceContainers([]);
        }
      }
    } catch (err) {
      console.error("Ошибка загрузки данных места:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить это место?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await softDelete("places", placeId);
      toast.success("Место успешно удалено");
      await loadPlaceData();
    } catch (err) {
      console.error("Ошибка при удалении места:", err);
      toast.error("Произошла ошибка при удалении места");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreDeleted("places", placeId);
      toast.success("Место успешно восстановлено");
      await loadPlaceData();
    } catch (err) {
      console.error("Ошибка при восстановлении места:", err);
      toast.error("Произошла ошибка при восстановлении места");
    } finally {
      setIsRestoring(false);
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

  if (error || !place) {
    return (
      <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <Button variant="ghost" onClick={() => router.push("/places")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error || "Место не найдено"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => router.push("/places")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {place.photo_url ? (
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                    <Image
                      src={place.photo_url}
                      alt={place.name || `Место #${place.id}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  </div>
                ) : (
                  <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl sm:text-2xl break-words">
                    {place.name || `Место #${place.id}`}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    ID: #{place.id}
                    {place.deleted_at && (
                      <Badge variant="destructive" className="ml-2">
                        Удалено
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              {user.email === "dzorogh@gmail.com" && (
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {!place.deleted_at && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditDialogOpen(true)}
                        disabled={isDeleting || isRestoring}
                        className="flex-1 sm:flex-initial"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Редактировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMoveDialogOpen(true)}
                        disabled={isDeleting || isRestoring}
                        className="flex-1 sm:flex-initial"
                      >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Переместить
                      </Button>
                    </>
                  )}
                  {place.deleted_at ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestore}
                      disabled={isDeleting || isRestoring}
                      className="flex-1 sm:flex-initial"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Восстановить
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting || isRestoring}
                      className="flex-1 sm:flex-initial"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MarkingDisplay
              typeCode={place.entity_type?.code}
              markingNumber={place.marking_number}
              generateMarking={generateMarking}
            />
            <div>
              <h3 className="text-sm font-medium mb-2">Фотография</h3>
              {place.photo_url ? (
                <div className="w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  <Image
                    src={place.photo_url}
                    alt={place.name || `Место #${place.id}`}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                    unoptimized={place.photo_url.includes("storage.supabase.co")}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Фотография не загружена</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Текущее местоположение</h3>
              {place.last_location ? (
                <div className="space-y-2">
                  {place.last_location.destination_type === "room" && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>
                        {place.last_location.destination_name ||
                          `Помещение #${place.last_location.destination_id}`}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Перемещено:{" "}
                    {new Date(place.last_location.moved_at).toLocaleString("ru-RU", {
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
                {new Date(place.created_at).toLocaleDateString("ru-RU", {
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
              Все перемещения этого места в хронологическом порядке
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
                        {transition.destination_type === "room" && transition.destination_name ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{transition.destination_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Местоположение не указано
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Содержимое места</CardTitle>
            <CardDescription>
              Вещи и контейнеры, которые находятся в этом месте
            </CardDescription>
          </CardHeader>
          <CardContent>
            {placeItems.length === 0 && placeContainers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Место пусто
              </p>
            ) : (
              <div className="space-y-6">
                {placeItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Вещи ({placeItems.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {placeItems.map((item) => (
                        <Link
                          key={item.id}
                          href={`/items/${item.id}`}
                          className="group"
                        >
                          <Card className="h-full hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center text-center space-y-2">
                                {item.photo_url ? (
                                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                    <Image
                                      src={item.photo_url}
                                      alt={item.name || `Вещь #${item.id}`}
                                      fill
                                      className="object-cover"
                                      sizes="80px"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center">
                                    <Package className="h-10 w-10 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="w-full">
                                  <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                    {item.name || `Вещь #${item.id}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: #{item.id}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {placeContainers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Контейнеры ({placeContainers.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {placeContainers.map((container) => (
                        <Link
                          key={container.id}
                          href={`/containers/${container.id}`}
                          className="group"
                        >
                          <Card className="h-full hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center text-center space-y-2">
                                {container.photo_url ? (
                                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                    <Image
                                      src={container.photo_url}
                                      alt={container.name || `Контейнер #${container.id}`}
                                      fill
                                      className="object-cover"
                                      sizes="80px"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center">
                                    <Container className="h-10 w-10 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="w-full">
                                  <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                    {container.name || `Контейнер #${container.id}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: #{container.id}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isEditDialogOpen && place && (
          <EditPlaceForm
            placeId={place.id}
            placeName={place.name}
            placeTypeId={place.entity_type_id}
            markingNumber={place.marking_number}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              loadPlaceData();
            }}
          />
        )}

        {isMoveDialogOpen && place && (
          <MovePlaceForm
            placeId={place.id}
            placeName={place.name}
            open={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
            onSuccess={() => {
              setIsMoveDialogOpen(false);
              loadPlaceData();
            }}
          />
        )}
      </div>
    </div>
  );
}
