"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getRoom, updateRoom } from "@/lib/rooms/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { resolveActions } from "@/lib/entities/resolve-actions";
import { EntityContentBlock } from "@/components/entity-detail/entity-content-block";
import { EntityRelatedLinks } from "@/components/entity-detail/entity-related-links";
import { EntityImageCard } from "@/components/entity-detail/entity-image-card";
import { ErrorMessage } from "@/components/common/error-message";
import type { RoomEntity } from "@/types/entity";
import { PageHeader } from "@/components/layout/page-header";
import { roomsEntityConfig } from "@/lib/entities/rooms/entity-config";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";
import BuildingCombobox from "@/components/fields/building-combobox";
import { useBuildings } from "@/lib/buildings/hooks/use-buildings";
import AddFurnitureForm from "@/components/forms/add-furniture-form";
import AddItemForm from "@/components/forms/add-item-form";
import AddContainerForm from "@/components/forms/add-container-form";

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
  const [roomFurniture, setRoomFurniture] = useState<Array<{
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

  const { types: _roomTypes } = useEntityTypes("room");
  useBuildings();
  const [name, setName] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addFurnitureOpen, setAddFurnitureOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addContainerOpen, setAddContainerOpen] = useState(false);

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

        const { room: roomData, items, containers, furniture } = response.data;

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
          room_type: roomData.room_type ?? null,
          building_id: roomData.building_id ?? null,
          building_name: roomData.building_name ?? null,
        });

        setRoomItems(items || []);
        setRoomFurniture(furniture || []);
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
      setBuildingId(room.building_id?.toString() ?? "");
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
        building_id: buildingId ? parseInt(buildingId) : null,
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

  const roomCtx = useMemo(
    () => ({
      refreshList: () => loadRoomData({ silent: true }),
      printLabel: (id: number, name?: string | null) => printLabel(id, name ?? null),
      handleDelete,
      handleRestore,
    }),
    [loadRoomData, printLabel, handleDelete, handleRestore]
  );
  const headerActions =
    room != null ? (
      <EntityActions actions={resolveActions(roomsEntityConfig.actions, room, roomCtx)} />
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
      {room && (
        <EntityRelatedLinks
          links={[
            { href: `/furniture?roomId=${room.id}`, label: "Мебель" },
            { href: `/items?roomId=${room.id}`, label: "Вещи" },
          ]}
        />
      )}
      {isPageLoading ? (
        <EntityDetailSkeleton />
      ) : room ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
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
              <CardContent>
                <form id={`room-form-${room.id}`} onSubmit={handleEditSubmit}>
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

                    <BuildingCombobox
                      selectedBuildingId={buildingId}
                      onBuildingIdChange={setBuildingId}
                      disabled={isSubmitting}
                      label="Здание (необязательно)"
                    />

                    <EntityTypeSelect
                      type="room"
                      value={roomTypeId ? parseInt(roomTypeId) : null}
                      onValueChange={(v) => setRoomTypeId(v ?? "")}
                    />

                    <ErrorMessage message={formError ?? ""} />
                  </FieldGroup>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="submit" form={`room-form-${room.id}`} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </CardFooter>
            </Card>

            <EntityImageCard
              entityType="room"
              entityId={room.id}
              entityName={name}
              photoUrl={room.photo_url ?? null}
              onPhotoChange={async (url) => {
                const res = await updateRoom(room.id, { photo_url: url });
                if (res.error) throw new Error(res.error);
                await loadRoomData({ silent: true });
              }}
            />
          </div>

          <div className="flex flex-col gap-6">
            <EntityContentBlock
              title="Мебель"
              description="Мебель в этом помещении"
              items={roomFurniture}
              entityType="furniture"
              emptyMessage="Нет мебели"
              addButton={{
                label: "Добавить мебель",
                onClick: () => setAddFurnitureOpen(true),
              }}
            />
            <EntityContentBlock
              title="Вещи"
              description="Вещи, которые находятся в этом помещении"
              items={roomItems}
              entityType="items"
              emptyMessage="Нет вещей"
              addButton={{
                label: "Добавить вещь",
                onClick: () => setAddItemOpen(true),
              }}
            />
            <EntityContentBlock
              title="Контейнеры"
              description="Контейнеры, которые находятся в этом помещении"
              items={roomContainers}
              entityType="containers"
              emptyMessage="Нет контейнеров"
              addButton={{
                label: "Добавить контейнер",
                onClick: () => setAddContainerOpen(true),
              }}
            />
          </div>
        </div>
      ) : null}

      <AddFurnitureForm
        open={addFurnitureOpen}
        onOpenChange={setAddFurnitureOpen}
        onSuccess={() => loadRoomData({ silent: true })}
        initialRoomId={room?.id ?? undefined}
      />
      <AddItemForm
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        onSuccess={() => loadRoomData({ silent: true })}
        initialDestinationType="room"
        initialDestinationId={room?.id ?? undefined}
      />
      <AddContainerForm
        open={addContainerOpen}
        onOpenChange={setAddContainerOpen}
        onSuccess={() => loadRoomData({ silent: true })}
        initialDestinationType="room"
        initialDestinationId={room?.id ?? undefined}
      />
    </div>
  );
}
