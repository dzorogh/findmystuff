"use client";

// React и Next.js
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";

// Supabase и контексты
import { createClient } from "@/lib/supabase/client";
import { useCurrentPage } from "@/contexts/current-page-context";
import { useUser } from "@/hooks/use-user";
import { usePlaceMarking } from "@/hooks/use-place-marking";

// UI компоненты
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

// Общие компоненты
import { MarkingDisplay } from "@/components/common/marking-display";

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
import { EntityContentGrid } from "@/components/entity-detail/entity-content-grid";

// Формы
import EditPlaceForm from "@/components/forms/edit-place-form";
import MovePlaceForm from "@/components/forms/move-place-form";

// Утилиты
import { useEntityActions } from "@/hooks/use-entity-actions";

// Типы
import type { Transition, Location, PlaceEntity } from "@/types/entity";

interface Place extends PlaceEntity {}

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { generateMarking } = usePlaceMarking();
  const { setEntityName, setIsLoading } = useCurrentPage();
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
  const [isLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const loadPlaceData = useCallback(async () => {
    if (!user) return;

    setIsPageLoading(true);
    setIsLoading(true); // Устанавливаем загрузку в контекст для TopBar
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
        setIsPageLoading(false);
        setIsLoading(false);
        setEntityName(null);
        return;
      }

      // Устанавливаем имя в контекст сразу после получения данных места
      // чтобы оно отображалось в крошках как можно раньше
      const nameToSet = placeData.name || `Место #${placeData.id}`;
      flushSync(() => {
        setEntityName(nameToSet);
      });
      setIsLoading(false);

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
      const transitionsWithNames = (transitionsData || []).map((t): Transition => {
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
      const lastLocation: Location | null = lastTransition
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

      const placeObject = {
        id: placeData.id,
        name: placeData.name,
        entity_type_id: placeData.entity_type_id || null,
        entity_type: entityType,
        marking_number: placeData.marking_number,
        photo_url: placeData.photo_url,
        created_at: placeData.created_at,
        deleted_at: placeData.deleted_at,
        last_location: lastLocation,
      };

      setPlace(placeObject);
      setTransitions(transitionsWithNames);

      // Загружаем все transitions для этого места одним запросом (items и containers)
      const { data: allTransitionsData } = await supabase
        .from("transitions")
        .select("item_id, container_id, created_at")
        .eq("destination_type", "place")
        .eq("destination_id", placeId)
        .order("created_at", { ascending: false });

      // Разделяем transitions по типам
      const itemTransitionsMap = new Map<number, any>();
      const containerTransitionsMap = new Map<number, any>();

      (allTransitionsData || []).forEach((t) => {
        if (t.item_id && !itemTransitionsMap.has(t.item_id)) {
          itemTransitionsMap.set(t.item_id, t);
        }
        if (t.container_id && !containerTransitionsMap.has(t.container_id)) {
          containerTransitionsMap.set(t.container_id, t);
        }
      });

      // Обрабатываем вещи и контейнеры
      const itemIds = Array.from(itemTransitionsMap.keys());
      const containerIds = Array.from(containerTransitionsMap.keys());

      // Объединяем запросы transitions для items и containers в один
      if (itemIds.length > 0 || containerIds.length > 0) {
        let allTransitionsQuery = supabase
          .from("transitions")
          .select("*")
          .order("created_at", { ascending: false });

        // Используем OR условие для объединения запросов
        if (itemIds.length > 0 && containerIds.length > 0) {
          allTransitionsQuery = allTransitionsQuery.or(
            `item_id.in.(${itemIds.join(',')}),container_id.in.(${containerIds.join(',')})`
          );
        } else if (itemIds.length > 0) {
          allTransitionsQuery = allTransitionsQuery.in("item_id", itemIds);
        } else if (containerIds.length > 0) {
          allTransitionsQuery = allTransitionsQuery.in("container_id", containerIds);
        }

        const { data: allTransitionsData } = await allTransitionsQuery;

        // Разделяем transitions по типам
        const lastItemTransitions = new Map<number, any>();
        const lastContainerTransitions = new Map<number, any>();

        (allTransitionsData || []).forEach((t) => {
          if (t.item_id && !lastItemTransitions.has(t.item_id)) {
            lastItemTransitions.set(t.item_id, t);
          }
          if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
            lastContainerTransitions.set(t.container_id, t);
          }
        });

        // Обрабатываем вещи
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

        // Обрабатываем контейнеры
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
        setPlaceItems([]);
        setPlaceContainers([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки данных места:", err);
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных");
      setIsLoading(false); // Загрузка завершена с ошибкой
      setEntityName(null);
    } finally {
      setIsPageLoading(false);
    }
  }, [user, placeId, setEntityName, setIsLoading]);

  useEntityDataLoader({
    user,
    isUserLoading,
    entityId: placeId,
    loadData: loadPlaceData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "places",
    entityId: placeId,
    entityName: "Место",
    onSuccess: loadPlaceData,
  });


  if (isUserLoading || isLoading) {
    return <EntityDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (error || !place) {
    return <EntityDetailError error={error} entityName="Место" />;
  }

  return (
    <div className="container pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <EntityHeader
            id={place.id}
            name={place.name}
            photoUrl={place.photo_url}
            isDeleted={!!place.deleted_at}
            defaultIcon={<MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />}
            defaultName="Место"
            actions={
              <EntityActions
                isDeleted={!!place.deleted_at}
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
            <MarkingDisplay
              typeCode={place.entity_type?.code}
              markingNumber={place.marking_number}
              generateMarking={generateMarking}
            />
            <EntityPhoto
              photoUrl={place.photo_url}
              name={place.name || `Место #${place.id}`}
              defaultIcon={<MapPin className="h-12 w-12 mx-auto text-muted-foreground" />}
              size="large"
              aspectRatio="video"
            />
            <EntityLocation location={place.last_location || null} />
            <EntityCreatedDate createdAt={place.created_at} label="Создано" />
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
            <TransitionsTable
              transitions={transitions}
              emptyMessage="История перемещений пуста"
            />
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
                  <EntityContentGrid
                    items={placeItems}
                    emptyMessage=""
                    entityType="items"
                    title="Вещи"
                  />
                )}
                {placeContainers.length > 0 && (
                  <EntityContentGrid
                    items={placeContainers}
                    emptyMessage=""
                    entityType="containers"
                    title="Контейнеры"
                  />
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
