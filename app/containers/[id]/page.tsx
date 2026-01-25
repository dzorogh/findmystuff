"use client";

// React и Next.js
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";

// Supabase и контексты
import { createClient } from "@/lib/supabase/client";
import { useCurrentPage } from "@/contexts/current-page-context";
import { useUser } from "@/hooks/use-user";
import { useContainerMarking } from "@/hooks/use-container-marking";

// UI компоненты
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "lucide-react";

// Общие компоненты
import { MarkingDisplay } from "@/components/common/marking-display";

// Компоненты entity-detail
import { useEntityDataLoader } from "@/hooks/use-entity-data-loader";
import { EntityDetailSkeleton } from "@/components/entity-detail/entity-detail-skeleton";
import { EntityDetailError } from "@/components/entity-detail/entity-detail-error";
import { EntityHeader } from "@/components/entity-detail/entity-header";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { EntityLocation } from "@/components/entity-detail/entity-location";
import { TransitionsTable } from "@/components/entity-detail/transitions-table";
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";
import { EntityCreatedDate } from "@/components/entity-detail/entity-created-date";

// Формы
import EditContainerForm from "@/components/forms/edit-container-form";
import MoveContainerForm from "@/components/forms/move-container-form";

// Утилиты
import { useEntityActions } from "@/hooks/use-entity-actions";

// Типы
import type { Transition, Location, ContainerEntity } from "@/types/entity";

interface Container extends ContainerEntity {
  entity_type?: {
    code: string;
    name: string;
  } | null;
}

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const containerId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { generateMarking } = useContainerMarking();
  const { setEntityName, setIsLoading } = useCurrentPage();
  const [container, setContainer] = useState<Container | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [containerItems, setContainerItems] = useState<Array<{
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const loadContainerData = useCallback(async () => {
    if (!user) return;

    setIsPageLoading(true);
    setIsLoading(true); // Устанавливаем загрузку в контекст для TopBar
    setError(null);

    try {
      const supabase = createClient();

      // Загружаем контейнер
      const { data: containerData, error: containerError } = await supabase
        .from("containers")
        .select("id, name, entity_type_id, marking_number, photo_url, created_at, deleted_at, entity_types(code, name)")
        .eq("id", containerId)
        .single();

      if (containerError) {
        throw containerError;
      }

      if (!containerData) {
        setError("Контейнер не найден");
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      // Устанавливаем имя в контекст сразу после получения данных контейнера
      // чтобы оно отображалось в крошках как можно раньше
      const nameToSet = containerData.name || `Контейнер #${containerData.id}`;
      flushSync(() => {
        setEntityName(nameToSet);
      });
      setIsLoading(false);

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
            destination_name: lastTransition.destination_name || null,
            moved_at: lastTransition.created_at,
          }
        : null;

      let entityType: { code: string; name: string } | null = null;
      if (containerData.entity_types) {
        if (Array.isArray(containerData.entity_types) && containerData.entity_types.length > 0) {
          entityType = containerData.entity_types[0];
        } else if (!Array.isArray(containerData.entity_types)) {
          entityType = containerData.entity_types;
        }
      }

      setContainer({
        id: containerData.id,
        name: containerData.name,
        entity_type_id: containerData.entity_type_id || null,
        entity_type: entityType,
        marking_number: containerData.marking_number,
        photo_url: containerData.photo_url,
        created_at: containerData.created_at,
        deleted_at: containerData.deleted_at,
        last_location: lastLocation,
      });
      setTransitions(transitionsWithNames);

      // Загружаем вещи, которые находятся в этом контейнере
      // Сначала получаем item_ids, которые перемещались в этот контейнер
      const { data: itemsTransitionsData, error: itemsTransitionsError } = await supabase
        .from("transitions")
        .select("item_id")
        .eq("destination_type", "container")
        .eq("destination_id", containerId);

      if (itemsTransitionsError) {
        console.error("Ошибка при загрузке transitions вещей:", itemsTransitionsError);
        setContainerItems([]);
      } else {
        // Получаем уникальные item_ids
        const itemIds = Array.from(
          new Set(
            (itemsTransitionsData || [])
              .map((t) => t.item_id)
              .filter((id): id is number => id !== null && id !== undefined)
          )
        );

        if (itemIds.length > 0) {
          // Получаем все transitions для этих вещей одним запросом
          const { data: allItemTransitionsData, error: allItemTransitionsError } = await supabase
            .from("transitions")
            .select("*")
            .in("item_id", itemIds)
            .order("created_at", { ascending: false });

          if (allItemTransitionsError) {
            console.error("Ошибка при загрузке всех transitions вещей:", allItemTransitionsError);
            setContainerItems([]);
          } else {
            // Находим последние transitions для каждого item
            const lastItemTransitions = new Map<number, any>();
            (allItemTransitionsData || []).forEach((t) => {
              if (t.item_id && !lastItemTransitions.has(t.item_id)) {
                lastItemTransitions.set(t.item_id, t);
              }
            });

            // Фильтруем только те вещи, которые все еще находятся в этом контейнере
            const itemsInContainer = Array.from(lastItemTransitions.entries())
              .filter(([itemId, transition]) => 
                transition.destination_type === "container" && 
                transition.destination_id === containerId
              )
              .map(([itemId]) => itemId);

            if (itemsInContainer.length > 0) {
              const { data: itemsData, error: itemsError } = await supabase
                .from("items")
                .select("id, name, photo_url, created_at")
                .in("id", itemsInContainer)
                .is("deleted_at", null)
                .order("created_at", { ascending: false });

              if (itemsError) {
                console.error("Ошибка при загрузке вещей:", itemsError);
                setContainerItems([]);
              } else {
                setContainerItems(itemsData || []);
              }
            } else {
              setContainerItems([]);
            }
          }
        } else {
          setContainerItems([]);
        }
      }
    } catch (err) {
      console.error("Ошибка загрузки данных контейнера:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      setIsLoading(false); // Загрузка завершена с ошибкой
      setEntityName(null);
    } finally {
      setIsPageLoading(false);
    }
  }, [user, containerId, setEntityName, setIsLoading]);

  useEntityDataLoader({
    user,
    isUserLoading,
    entityId: containerId,
    loadData: loadContainerData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "containers",
    entityId: containerId,
    entityName: "Контейнер",
    onSuccess: loadContainerData,
  });

  const handleEditSuccess = () => {
    setIsEditing(false);
    loadContainerData();
  };

  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !container) {
    return <EntityDetailError error={error} entityName="Контейнер" />;
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <EntityHeader
            id={container.id}
            name={container.name}
            photoUrl={container.photo_url}
            isDeleted={!!container.deleted_at}
            defaultIcon={<Container className="h-12 w-12 text-muted-foreground" />}
            defaultName="Контейнер"
            actions={
              <EntityActions
                isDeleted={!!container.deleted_at}
                isDeleting={isDeleting}
                isRestoring={isRestoring}
                onEdit={() => setIsEditing(true)}
                onMove={() => setIsMoving(true)}
                onDelete={handleDelete}
                onRestore={handleRestore}
              />
            }
          />
          <CardContent className="space-y-4">
            <MarkingDisplay
              typeCode={container.entity_type?.code}
              markingNumber={container.marking_number}
              generateMarking={generateMarking}
            />
            <EntityLocation location={container.last_location || null} />
            <EntityCreatedDate createdAt={container.created_at} />
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
            <TransitionsTable
              transitions={transitions}
              emptyMessage="История перемещений пуста"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Содержимое контейнера</CardTitle>
            <CardDescription>
              Вещи, которые находятся в этом контейнере
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EntityContentGrid
              items={containerItems}
              emptyMessage="Контейнер пуст"
              entityType="items"
            />
          </CardContent>
        </Card>

        {isEditing && container && (
          <EditContainerForm
            containerId={container.id}
            containerName={container.name}
            containerTypeId={container.entity_type_id}
            markingNumber={container.marking_number}
            open={isEditing}
            onOpenChange={setIsEditing}
            onSuccess={handleEditSuccess}
          />
        )}

        {isMoving && container && (
          <MoveContainerForm
            containerId={container.id}
            containerName={container.name}
            open={isMoving}
            onOpenChange={setIsMoving}
            onSuccess={() => {
              setIsMoving(false);
              loadContainerData();
            }}
          />
        )}
      </div>
    </div>
  );
}
