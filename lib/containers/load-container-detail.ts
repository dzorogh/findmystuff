/**
 * Загрузка данных страницы детали контейнера: контейнер, transitions, вещи в контейнере.
 * Используется в app/api/containers/[id]/route.ts GET.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { normalizeEntityTypeRelation } from "@/lib/shared/api/normalize-entity-type-relation";
import type {
  Container,
  ContainerDetailData,
  LoadDetailError,
  Transition,
  Location,
  Item,
} from "@/types/entity";

export type { ContainerDetailData, LoadDetailError };

/**
 * Загружает данные контейнера по id. При ошибке БД или отсутствии контейнера возвращает { error, status }.
 */
export async function loadContainerDetail(
  supabase: SupabaseClient,
  containerId: number
): Promise<ContainerDetailData | LoadDetailError> {
  const { data: containerData, error: containerError } = await supabase
    .from("containers")
    .select(
      "id, name, entity_type_id, photo_url, created_at, deleted_at, entity_types(name)"
    )
    .eq("id", containerId)
    .single();

  if (containerError) {
    return { error: containerError.message, status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }
  if (!containerData) {
    return { error: "Контейнер не найден", status: HTTP_STATUS.NOT_FOUND };
  }

  const { data: transitionsData, error: transitionsError } = await supabase
    .from("transitions")
    .select("*")
    .eq("container_id", containerId)
    .order("created_at", { ascending: false });

  if (transitionsError) {
    return { error: transitionsError.message, status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }

  const placeIds = (transitionsData || [])
    .filter((t) => t.destination_type === "place" && t.destination_id)
    .map((t) => t.destination_id);
  const containerIds = (transitionsData || [])
    .filter((t) => t.destination_type === "container" && t.destination_id)
    .map((t) => t.destination_id);
  const roomIds = (transitionsData || [])
    .filter((t) => t.destination_type === "room" && t.destination_id)
    .map((t) => t.destination_id);
  const furnitureIds = (transitionsData || [])
    .filter((t) => t.destination_type === "furniture" && t.destination_id)
    .map((t) => t.destination_id);

  const [placesData, containersData, roomsData, furnitureData] =
    await Promise.all([
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
      furnitureIds.length > 0
        ? supabase
            .from("furniture")
            .select("id, name, room_id")
            .in("id", furnitureIds)
            .is("deleted_at", null)
        : { data: [] },
    ]);

  const furnitureRows = (furnitureData?.data || []) as {
    id: number;
    name: string | null;
    room_id: number | null;
  }[];
  const furnitureMap = new Map(
    furnitureRows.map((f) => [f.id, f.name ?? null])
  );
  const furnitureRoomIds = furnitureRows
    .map((f) => f.room_id)
    .filter((id): id is number => id != null);
  const { data: furnitureRoomsData } =
    furnitureRoomIds.length > 0
      ? await supabase
          .from("rooms")
          .select("id, name")
          .in("id", furnitureRoomIds)
          .is("deleted_at", null)
      : { data: [] };
  const furnitureRoomsMap = new Map(
    ((furnitureRoomsData || []) as { id: number; name: string | null }[]).map(
      (r) => [r.id, r.name ?? null]
    )
  );

  const placesMap = new Map(
    (placesData.data || []).map((p: { id: number; name: string | null }) => [
      p.id,
      p.name ?? null,
    ])
  );
  const containersMap = new Map(
    (containersData.data || []).map(
      (c: { id: number; name: string | null }) => [c.id, c.name ?? null]
    )
  );
  const roomsMap = new Map(
    (roomsData.data || []).map((r: { id: number; name: string | null }) => [
      r.id,
      r.name ?? null,
    ])
  );

  const allPlaceIds = Array.from(placesMap.keys());
  const { data: placesTransitionsData } =
    allPlaceIds.length > 0
      ? await supabase
          .from("transitions")
          .select("*")
          .eq("destination_type", "room")
          .in("place_id", allPlaceIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  type PlaceTransitionRow = { place_id: number | null; destination_id: number | null };
  const lastPlaceTransitions = new Map<number, PlaceTransitionRow>();
  (placesTransitionsData || []).forEach((t: PlaceTransitionRow) => {
    if (t.place_id && !lastPlaceTransitions.has(t.place_id)) {
      lastPlaceTransitions.set(t.place_id, t);
    }
  });

  const placeRoomIds = Array.from(lastPlaceTransitions.values())
    .map((t) => t.destination_id)
    .filter((id): id is number => id !== null);

  const { data: placeRoomsData } =
    placeRoomIds.length > 0
      ? await supabase
          .from("rooms")
          .select("id, name")
          .in("id", placeRoomIds)
          .is("deleted_at", null)
      : { data: [] };

  const placeRoomsMap = new Map(
    (placeRoomsData || []).map((r: { id: number; name: string | null }) => [
      r.id,
      r.name ?? null,
    ])
  );

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
        transition.room_name =
          placeRoomsMap.get(placeTransition.destination_id) || null;
      }
    } else if (t.destination_type === "container" && t.destination_id) {
      transition.destination_name =
        containersMap.get(t.destination_id) || null;
    } else if (t.destination_type === "room" && t.destination_id) {
      transition.destination_name = roomsMap.get(t.destination_id) || null;
    } else if (t.destination_type === "furniture" && t.destination_id) {
      transition.destination_name = furnitureMap.get(t.destination_id) || null;
      const furnitureRow = furnitureRows.find((f) => f.id === t.destination_id);
      if (furnitureRow?.room_id) {
        transition.room_name =
          furnitureRoomsMap.get(furnitureRow.room_id) || null;
      }
    }

    return transition;
  });

  const lastTransition = transitionsWithNames[0];
  const lastLocation: Location | null = lastTransition
    ? {
        destination_type: lastTransition.destination_type,
        destination_id: lastTransition.destination_id,
        destination_name: lastTransition.destination_name || null,
        moved_at: lastTransition.created_at,
      }
    : null;

  const entityType = normalizeEntityTypeRelation(containerData.entity_types);

  const container: Container = {
    id: containerData.id,
    name: containerData.name,
    entity_type_id: containerData.entity_type_id || null,
    entity_type: entityType,
    photo_url: containerData.photo_url,
    created_at: containerData.created_at,
    deleted_at: containerData.deleted_at,
    last_location: lastLocation,
  };

  const { data: itemsTransitionsData } = await supabase
    .from("transitions")
    .select("item_id")
    .eq("destination_type", "container")
    .eq("destination_id", containerId);

  let containerItems: Item[] = [];
  if (itemsTransitionsData && itemsTransitionsData.length > 0) {
    const itemIds = Array.from(
      new Set(
        itemsTransitionsData
          .map((t) => t.item_id)
          .filter((id): id is number => id !== null && id !== undefined)
      )
    );

    if (itemIds.length > 0) {
      const { data: allItemTransitionsData } = await supabase
        .from("transitions")
        .select("*")
        .in("item_id", itemIds)
        .order("created_at", { ascending: false });

      const lastItemTransitions = new Map<number, Transition>();
      (allItemTransitionsData || []).forEach((t) => {
        if (t.item_id && !lastItemTransitions.has(t.item_id)) {
          lastItemTransitions.set(t.item_id, t as Transition);
        }
      });

      const itemsInContainer = Array.from(lastItemTransitions.entries())
        .filter(
          ([, transition]) =>
            transition.destination_type === "container" &&
            transition.destination_id === containerId
        )
        .map(([itemId]) => itemId);

      if (itemsInContainer.length > 0) {
        const { data: itemsData } = await supabase
          .from("items")
          .select("id, name, photo_url, created_at, deleted_at")
          .in("id", itemsInContainer)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        containerItems = (itemsData || []) as Item[];
      }
    }
  }

  return {
    container,
    transitions: transitionsWithNames,
    items: containerItems,
  };
}
