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
import { Building2, Pencil, Trash2, RotateCcw, Package, MapPin, Container } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { softDelete, restoreDeleted } from "@/lib/soft-delete";
import EditRoomForm from "@/components/forms/edit-room-form";

interface Room {
  id: number;
  name: string | null;
  photo_url: string | null;
  created_at: string;
  deleted_at: string | null;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomItems, setRoomItems] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [roomPlaces, setRoomPlaces] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [roomContainers, setRoomContainers] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (user && !isUserLoading) {
      loadRoomData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isUserLoading, roomId]);

  const loadRoomData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Загружаем помещение
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, name, photo_url, created_at, deleted_at")
        .eq("id", roomId)
        .single();

      if (roomError) {
        throw roomError;
      }

      if (!roomData) {
        setError("Помещение не найдено");
        setIsLoading(false);
        return;
      }

      setRoom({
        id: roomData.id,
        name: roomData.name,
        photo_url: roomData.photo_url,
        created_at: roomData.created_at,
        deleted_at: roomData.deleted_at,
      });

      // Загружаем вещи, которые находятся в этом помещении
      const { data: itemsTransitionsData } = await supabase
        .from("transitions")
        .select("item_id, created_at")
        .eq("destination_type", "room")
        .eq("destination_id", roomId)
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

          const itemsInRoom = Array.from(lastItemTransitions.entries())
            .filter(([itemId, transition]) => 
              transition.destination_type === "room" && 
              transition.destination_id === roomId
            )
            .map(([itemId]) => itemId);

          if (itemsInRoom.length > 0) {
            const { data: itemsData } = await supabase
              .from("items")
              .select("id, name, photo_url, created_at")
              .in("id", itemsInRoom)
              .is("deleted_at", null)
              .order("created_at", { ascending: false });

            setRoomItems(itemsData || []);
          } else {
            setRoomItems([]);
          }
        } else {
          setRoomItems([]);
        }
      }

      // Загружаем места, которые находятся в этом помещении
      const { data: placesTransitionsData } = await supabase
        .from("transitions")
        .select("place_id, created_at")
        .eq("destination_type", "room")
        .eq("destination_id", roomId)
        .order("created_at", { ascending: false });

      if (placesTransitionsData) {
        const placeTransitionsMap = new Map<number, any>();
        (placesTransitionsData || []).forEach((t) => {
          if (t.place_id && !placeTransitionsMap.has(t.place_id)) {
            placeTransitionsMap.set(t.place_id, t);
          }
        });

        const placeIds = Array.from(placeTransitionsMap.keys());
        if (placeIds.length > 0) {
          const { data: allPlaceTransitionsData } = await supabase
            .from("transitions")
            .select("*")
            .in("place_id", placeIds)
            .order("created_at", { ascending: false });

          const lastPlaceTransitions = new Map<number, any>();
          (allPlaceTransitionsData || []).forEach((t) => {
            if (t.place_id && !lastPlaceTransitions.has(t.place_id)) {
              lastPlaceTransitions.set(t.place_id, t);
            }
          });

          const placesInRoom = Array.from(lastPlaceTransitions.entries())
            .filter(([placeId, transition]) => 
              transition.destination_type === "room" && 
              transition.destination_id === roomId
            )
            .map(([placeId]) => placeId);

          if (placesInRoom.length > 0) {
            const { data: placesData } = await supabase
              .from("places")
              .select("id, name, photo_url, created_at")
              .in("id", placesInRoom)
              .is("deleted_at", null)
              .order("created_at", { ascending: false });

            setRoomPlaces(placesData || []);
          } else {
            setRoomPlaces([]);
          }
        } else {
          setRoomPlaces([]);
        }
      }

      // Загружаем контейнеры, которые находятся в этом помещении
      const { data: containersTransitionsData } = await supabase
        .from("transitions")
        .select("container_id, created_at")
        .eq("destination_type", "room")
        .eq("destination_id", roomId)
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

          const containersInRoom = Array.from(lastContainerTransitions.entries())
            .filter(([containerId, transition]) => 
              transition.destination_type === "room" && 
              transition.destination_id === roomId
            )
            .map(([containerId]) => containerId);

          if (containersInRoom.length > 0) {
            const { data: containersData } = await supabase
              .from("containers")
              .select("id, name, photo_url, created_at")
              .in("id", containersInRoom)
              .is("deleted_at", null)
              .order("created_at", { ascending: false });

            setRoomContainers(containersData || []);
          } else {
            setRoomContainers([]);
          }
        } else {
          setRoomContainers([]);
        }
      }
    } catch (err) {
      console.error("Ошибка загрузки данных помещения:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить это помещение?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await softDelete("rooms", roomId);
      toast.success("Помещение успешно удалено");
      await loadRoomData();
    } catch (err) {
      console.error("Ошибка при удалении помещения:", err);
      toast.error("Произошла ошибка при удалении помещения");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreDeleted("rooms", roomId);
      toast.success("Помещение успешно восстановлено");
      await loadRoomData();
    } catch (err) {
      console.error("Ошибка при восстановлении помещения:", err);
      toast.error("Произошла ошибка при восстановлении помещения");
    } finally {
      setIsRestoring(false);
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
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

  if (error || !room) {
    return (
      <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error || "Помещение не найдено"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {room.photo_url ? (
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                    <Image
                      src={room.photo_url}
                      alt={room.name || `Помещение #${room.id}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  </div>
                ) : (
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl sm:text-2xl break-words">
                    {room.name || `Помещение #${room.id}`}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    ID: #{room.id}
                    {room.deleted_at && (
                      <Badge variant="destructive" className="ml-2">
                        Удалено
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              {user.email === "dzorogh@gmail.com" && (
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {!room.deleted_at && (
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
                  )}
                  {room.deleted_at ? (
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
            <div>
              <h3 className="text-sm font-medium mb-2">Фотография</h3>
              {room.photo_url ? (
                <div className="w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  <Image
                    src={room.photo_url}
                    alt={room.name || `Помещение #${room.id}`}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                    unoptimized={room.photo_url.includes("storage.supabase.co")}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Фотография не загружена</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Создано:{" "}
                {new Date(room.created_at).toLocaleDateString("ru-RU", {
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
            <CardTitle>Содержимое помещения</CardTitle>
            <CardDescription>
              Вещи, места и контейнеры, которые находятся в этом помещении
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roomItems.length === 0 && roomPlaces.length === 0 && roomContainers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Помещение пусто
              </p>
            ) : (
              <div className="space-y-6">
                {roomItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Вещи ({roomItems.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {roomItems.map((item) => (
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
                {roomPlaces.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Места ({roomPlaces.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {roomPlaces.map((place) => (
                        <Link
                          key={place.id}
                          href={`/places/${place.id}`}
                          className="group"
                        >
                          <Card className="h-full hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center text-center space-y-2">
                                {place.photo_url ? (
                                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                    <Image
                                      src={place.photo_url}
                                      alt={place.name || `Место #${place.id}`}
                                      fill
                                      className="object-cover"
                                      sizes="80px"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center">
                                    <MapPin className="h-10 w-10 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="w-full">
                                  <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                    {place.name || `Место #${place.id}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: #{place.id}
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
                {roomContainers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Контейнеры ({roomContainers.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {roomContainers.map((container) => (
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

        {isEditDialogOpen && room && (
          <EditRoomForm
            roomId={room.id}
            roomName={room.name}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              loadRoomData();
            }}
          />
        )}
      </div>
    </div>
  );
}
