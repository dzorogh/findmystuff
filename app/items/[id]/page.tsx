"use client";

// React и Next.js
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";

// Supabase и контексты
import { createClient } from "@/lib/supabase/client";
import { useCurrentPage } from "@/contexts/current-page-context";
import { useUser } from "@/hooks/use-user";

// UI компоненты
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

// Компоненты entity-detail
import { useEntityDataLoader } from "@/hooks/use-entity-data-loader";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityHeader } from "@/components/entity-detail/entity-header";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityLocation } from "@/components/entity-detail/entity-location";
import { EntityPhoto } from "@/components/entity-detail/entity-photo";
import { EntityCreatedDate } from "@/components/entity-detail/entity-created-date";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";

// Формы
import EditItemForm from "@/components/forms/edit-item-form";
import MoveItemForm from "@/components/forms/move-item-form";

// Утилиты
import { useEntityActions } from "@/hooks/use-entity-actions";

// Типы
import type { Transition, Location, ItemEntity } from "@/types/entity";

interface Item extends ItemEntity {}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { setEntityName, setIsLoading } = useCurrentPage();
  const [item, setItem] = useState<Item | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const loadItemData = useCallback(async () => {
    if (!user) return;

    setIsPageLoading(true);
    setIsLoading(true); // Устанавливаем загрузку в контекст для TopBar
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
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
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

      // Сначала загружаем контейнеры, чтобы получить их transitions и узнать места
      const containersData = containerIds.length > 0
        ? await supabase
            .from("containers")
            .select("id, name")
            .in("id", containerIds)
            .is("deleted_at", null)
        : { data: [] };

      const containersMap = new Map(
        (containersData.data || []).map((c) => [c.id, c.name])
      );

      // Получаем transitions для контейнеров, чтобы узнать их места
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

      // Добавляем места из transitions контейнеров к списку мест
      const containerPlaceIds = Array.from(lastContainerTransitions.values())
        .filter((t) => t.destination_type === "place" && t.destination_id)
        .map((t) => t.destination_id);
      const allPlaceIds = Array.from(new Set([...placeIds, ...containerPlaceIds]));

      const [placesData, roomsData] = await Promise.all([
        allPlaceIds.length > 0
          ? supabase
              .from("places")
              .select("id, name")
              .in("id", allPlaceIds)
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
      const roomsMap = new Map(
        (roomsData.data || []).map((r) => [r.id, r.name])
      );

      // Для мест получаем их помещения
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

      // Формируем transitions с названиями
      const transitionsWithNames = (transitionsData || []).map((t): Transition => {
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
      const lastLocation: Location | null = lastTransition
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

      // Устанавливаем имя в контекст сразу после получения данных вещи
      // чтобы оно отображалось в крошках как можно раньше
      const nameToSet = itemData.name || `Вещь #${itemData.id}`;
      flushSync(() => {
        setEntityName(nameToSet);
      });
      setIsLoading(false);
    } catch (err) {
      console.error("Ошибка загрузки данных вещи:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      setIsLoading(false); // Загрузка завершена с ошибкой
      setEntityName(null);
    } finally {
      setIsPageLoading(false);
    }
  }, [user, itemId, setEntityName, setIsLoading]);

  useEntityDataLoader({
    user,
    isUserLoading,
    entityId: itemId,
    loadData: loadItemData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "items",
    entityId: itemId,
    entityName: "Вещь",
    onSuccess: loadItemData,
  });


  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !item) {
    return <EntityDetailError error={error} entityName="Вещь" />;
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <EntityHeader
            id={item.id}
            name={item.name}
            photoUrl={item.photo_url}
            isDeleted={!!item.deleted_at}
            defaultIcon={<Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />}
            defaultName="Вещь"
            actions={
              <EntityActions
                isDeleted={!!item.deleted_at}
                isDeleting={isDeleting}
                isRestoring={isRestoring}
                onEdit={() => setIsEditDialogOpen(true)}
                onMove={() => setIsMoveDialogOpen(true)}
                onDelete={handleDelete}
                onRestore={handleRestore}
              />
            }
            layout="compact"
          />
          <CardContent className="space-y-4">
            <EntityPhoto
              photoUrl={item.photo_url}
              name={item.name || `Вещь #${item.id}`}
              defaultIcon={<Package className="h-12 w-12 mx-auto text-muted-foreground" />}
              size="large"
              aspectRatio="video"
            />
            <EntityLocation location={item.last_location || null} variant="detailed" />
            <EntityCreatedDate createdAt={item.created_at} label="Создано" />
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
            <TransitionsTable
              transitions={transitions}
              emptyMessage="История перемещений пуста"
            />
          </CardContent>
        </Card>

        {isEditDialogOpen && item && (
          <EditItemForm
            itemId={item.id}
            itemName={item.name}
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
