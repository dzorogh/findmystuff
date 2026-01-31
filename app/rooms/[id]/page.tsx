"use client";

// React и Next.js
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";

// Контексты
import { useCurrentPage } from "@/contexts/current-page-context";
import { useUser } from "@/hooks/use-user";

// API Client
import { apiClient } from "@/lib/api-client";

// UI компоненты
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

// Компоненты entity-detail
import { useEntityDataLoader } from "@/hooks/use-entity-data-loader";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityHeader } from "@/components/entity-detail/entity-header";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityPhoto } from "@/components/entity-detail/entity-photo";
import { EntityCreatedDate } from "@/components/entity-detail/entity-created-date";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";

// Формы
import EditRoomForm from "@/components/forms/edit-room-form";

// Утилиты
import { useEntityActions } from "@/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/hooks/use-print-entity-label";

// Типы
import type { RoomEntity } from "@/types/entity";

type Room = RoomEntity;

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { setEntityName, setIsLoading } = useCurrentPage();
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      const response = await apiClient.getRoom(roomId);

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

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !room) {
    return <EntityDetailError error={error} entityName="Помещение" />;
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <EntityHeader
            id={room.id}
            name={room.name}
            photoUrl={room.photo_url}
            isDeleted={!!room.deleted_at}
            defaultIcon={<Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />}
            defaultName="Помещение"
            actions={
              <EntityActions
                isDeleted={!!room.deleted_at}
                isDeleting={isDeleting}
                isRestoring={isRestoring}
                onEdit={() => setIsEditDialogOpen(true)}
                onPrintLabel={room ? () => printLabel(room.id, room.name) : undefined}
                onDelete={handleDelete}
                onRestore={handleRestore}
                showMove={false}
              />
            }
            layout="compact"
          />
          <CardContent className="space-y-4">
            <EntityPhoto
              photoUrl={room.photo_url}
              name={room.name || `Помещение #${room.id}`}
              defaultIcon={<Building2 className="h-12 w-12 mx-auto text-muted-foreground" />}
              size="large"
              aspectRatio="video"
            />
            <EntityCreatedDate createdAt={room.created_at} label="Создано" />
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
