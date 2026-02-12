"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getRoom, updateRoom } from "@/lib/rooms/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import ImageUpload from "@/components/fields/image-upload";
import { GenerateImageButton } from "@/components/fields/generate-image-button";
import { ErrorMessage } from "@/components/common/error-message";
import type { RoomEntity } from "@/types/entity";
import { PageHeader } from "@/components/layout/page-header";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";

type Room = RoomEntity;

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = parseInt(params.id as string, 10);
  const isInvalidId = Number.isNaN(roomId);

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

  const loadRoomData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setIsPageLoading(true);
      setError(null);

      try {
        const response = await getRoom(roomId);

        if (response.error || !response.data) {
          setError("Помещение не найдено");
          if (!silent) setIsPageLoading(false);
          return;
        }

        const { room: roomData, items, places, containers } = response.data;

        if (!roomData) {
          setError("Помещение не найдено");
          if (!silent) setIsPageLoading(false);
          return;
        }

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
      } finally {
        if (!silent) setIsPageLoading(false);
      }
    },
    [roomId]
  );

  useEntityDataLoader({
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

  if (isInvalidId) {
    return <EntityDetailError error="Некорректный ID помещения" entityName="Помещение" />;
  }

  if (error && !isLoading) {
    return <EntityDetailError error={error} entityName="Помещение" />;
  }

  if (!isLoading && !room) {
    return null;
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
        photo_url: (photoUrl ?? "") || null,
      });
      if (response.error) throw new Error(response.error);
      toast.success("Помещение успешно обновлено");
      await loadRoomData({ silent: true });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPageLoading = isLoading;

  const headerActions =
    room != null ? (
      <EntityActions
        actions={{
          actions: ["printLabel", "delete"],
          showRestoreWhenDeleted: true,
        }}
        callbacks={{
          onPrintLabel: () => printLabel(room.id, room.name),
          onDelete: handleDelete,
          onRestore: handleRestore,
        }}
        isDeleted={!!room.deleted_at}
        disabled={isDeleting || isRestoring}
        buttonVariant="default"
      />
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        isLoading={isPageLoading}
        title={room?.name ?? (room ? `Помещение #${room.id}` : "Помещение")}
        ancestors={[
          { label: "Помещения", href: "/rooms" },
        ]}
        actions={headerActions}
      />
      {isPageLoading ? (
        <EntityDetailSkeleton />
      ) : room ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <CardContent className="">
              <form onSubmit={handleEditSubmit}>
                <FieldGroup>
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

                  <EntityTypeSelect
                    type="room"
                    value={roomTypeId ? parseInt(roomTypeId) : null}
                    onValueChange={(v) => setRoomTypeId(v ?? "")}
                  />

                  <ImageUpload
                    value={photoUrl}
                    onChange={setPhotoUrl}
                    disabled={isSubmitting}
                    label="Фотография помещения (необязательно)"
                  />
                  <GenerateImageButton
                    entityName={name}
                    entityType="room"
                    onSuccess={async (url) => {
                      setPhotoUrl(url);
                      if (!room) return;
                      const res = await updateRoom(room.id, { photo_url: url });
                      if (res.error) return;
                      toast.success("Изображение сгенерировано и сохранено");
                      await loadRoomData({ silent: true });
                    }}
                    disabled={isSubmitting}
                  />

                  <ErrorMessage message={formError ?? ""} />

                  <div className="flex justify-end">
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
      ) : null}
    </div>
  );
}
