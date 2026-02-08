"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCurrentPage } from "@/lib/app/contexts/current-page-context";
import { useUser } from "@/lib/users/context";
import { getRoom, updateRoom } from "@/lib/rooms/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import ImageUpload from "@/components/fields/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import type { RoomEntity } from "@/types/entity";
import { PageHeader } from "@/components/layout/page-header";

type Room = RoomEntity;

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = parseInt(params.id as string, 10);
  const isInvalidId = Number.isNaN(roomId);

  const { user, isLoading: isUserLoading } = useUser();
  const { setEntityName, setIsLoading, setEntityActions } = useCurrentPage();
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
  const [isLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { types: roomTypes } = useEntityTypes("room");
  const [name, setName] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const loadRoomData = useCallback(async () => {
    if (!user) return;

    setIsPageLoading(true);
    setIsLoading(true); // Устанавливаем загрузку в контекст для TopBar
    setError(null);

    try {
      const response = await getRoom(roomId);

      if (response.error || !response.data) {
        setError("Помещение не найдено");
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      const { room: roomData, items, places, containers } = response.data;

      if (!roomData) {
        setError("Помещение не найдено");
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      // Устанавливаем имя в контекст сразу после получения данных помещения
      // чтобы оно отображалось в крошках как можно раньше
      const nameToSet = roomData.name || `Помещение #${roomData.id}`;
      flushSync(() => {
        setEntityName(nameToSet);
      });
      setIsLoading(false);

      setRoom({
        id: roomData.id,
        name: roomData.name,
        photo_url: roomData.photo_url,
        created_at: roomData.created_at,
        deleted_at: roomData.deleted_at,
        room_type_id: roomData.room_type_id ?? null,
      });

      setRoomItems(items || []);
      setRoomPlaces(places || []);
      setRoomContainers(containers || []);
    } catch (err) {
      console.error("Ошибка загрузки данных помещения:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      setIsLoading(false); // Загрузка завершена с ошибкой
      setEntityName(null);
    } finally {
      setIsPageLoading(false);
    }
  }, [user, roomId, setEntityName, setIsLoading]);

  useEntityDataLoader({
    user,
    isUserLoading,
    entityId: roomId,
    loadData: loadRoomData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "rooms",
    entityId: roomId,
    entityName: "Помещение",
    onSuccess: loadRoomData,
  });

  const printLabel = usePrintEntityLabel("room");

  useEffect(() => {
    if (room) {
      setName(room.name ?? "");
      setRoomTypeId(room.room_type_id?.toString() ?? "");
      setPhotoUrl(room.photo_url ?? null);
    }
  }, [room]);

  useEffect(() => {
    if (!room) {
      setEntityActions(null);
      return;
    }
    setEntityActions(
      <EntityActions
        isDeleted={!!room.deleted_at}
        isDeleting={isDeleting}
        isRestoring={isRestoring}
        showEdit={false}
        onEdit={() => { }}
        onPrintLabel={() => printLabel(room.id, room.name)}
        onDelete={handleDelete}
        onRestore={handleRestore}
        showMove={false}
      />
    );
    return () => setEntityActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers from hooks; re-run only when entity/loading state changes
  }, [room, isDeleting, isRestoring]);

  if (isInvalidId) {
    return <EntityDetailError error="Некорректный ID помещения" entityName="Помещение" />;
  }

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !room) {
    return <EntityDetailError error={error} entityName="Помещение" />;
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!room) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const response = await updateRoom(room.id, {
        name: name.trim() || undefined,
        room_type_id: roomTypeId ? parseInt(roomTypeId) : null,
        photo_url: photoUrl || undefined,
      });
      if (response.error) throw new Error(response.error);
      toast.success("Помещение успешно обновлено");
      await loadRoomData();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        title={room.name ?? `Помещение #${room.id}`}
        ancestors={[
          { label: "Помещения", href: "/rooms" },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Редактирование помещения</CardTitle>
          <CardDescription className="flex items-center gap-2 flex-wrap">
            ID: #{room.id}
            {room.deleted_at && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge variant="destructive">Удалено</Badge>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleEditSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`room-type-${room.id}`}>Тип помещения (необязательно)</FieldLabel>
                <Combobox
                  items={[
                    { value: "", label: "Не указан" },
                    ...roomTypes.map((type) => ({
                      value: type.id.toString(),
                      label: type.name,
                    })),
                  ]}
                  value={roomTypeId}
                  onValueChange={(v) => setRoomTypeId(v ?? "")}
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`room-name-${room.id}`}>Название помещения</FieldLabel>
                <Input
                  id={`room-name-${room.id}`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название помещения"
                  disabled={isSubmitting}
                />
              </Field>

              <ImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                disabled={isSubmitting}
                label="Фотография помещения (необязательно)"
              />

              <ErrorMessage message={formError ?? ""} />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Содержимое помещения</CardTitle>
            <CardDescription>
              Вещи, места и контейнеры, которые находятся в этом помещении
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roomItems.length === 0 && roomPlaces.length === 0 && roomContainers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Помещение пусто
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {roomItems.length > 0 && (
                  <EntityContentGrid
                    items={roomItems}
                    emptyMessage=""
                    entityType="items"
                    title="Вещи"
                  />
                )}
                {roomPlaces.length > 0 && (
                  <EntityContentGrid
                    items={roomPlaces}
                    emptyMessage=""
                    entityType="places"
                    title="Места"
                  />
                )}
                {roomContainers.length > 0 && (
                  <EntityContentGrid
                    items={roomContainers}
                    emptyMessage=""
                    entityType="containers"
                    title="Контейнеры"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
