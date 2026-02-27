/**
 * Загрузка данных страницы детали помещения: комната, вещи, места, контейнеры, мебель.
 * Используется в app/api/rooms/[id]/route.ts GET.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEntityTypeRelation } from "@/lib/shared/api/normalize-entity-type-relation";
import { getItemIdsInRoomRpc } from "@/lib/rooms/api";
import type { Item, Place, Container, Transition, Furniture } from "@/types/entity";

export type RoomDetailData = {
  room: {
    id: number;
    name: string | null;
    photo_url: string | null;
    created_at: string;
    deleted_at: string | null;
    room_type_id: number | null;
    room_type: { name: string } | null;
    building_id: number | null;
    building_name: string | null;
  };
  items: Item[];
  places: Place[];
  containers: Container[];
  furniture: Furniture[];
};

export type LoadRoomDetailError = { error: string; status: number };

/**
 * Загружает данные помещения по id. При ошибке БД или отсутствии комнаты возвращает { error, status }.
 */
export async function loadRoomDetail(
  supabase: SupabaseClient,
  roomId: number
): Promise<RoomDetailData | LoadRoomDetailError> {
  const [roomResult, itemIdsResult, transitionsResult, placesInRoomMv, furnitureResult] =
    await Promise.all([
      supabase
        .from("rooms")
        .select(
          "id, name, photo_url, created_at, deleted_at, room_type_id, building_id, entity_types(name), buildings(name)"
        )
        .eq("id", roomId)
        .single(),
      getItemIdsInRoomRpc(supabase, roomId),
      supabase
        .from("transitions")
        .select("place_id, container_id, destination_type, destination_id, created_at")
        .eq("destination_type", "room")
        .eq("destination_id", roomId)
        .order("created_at", { ascending: false }),
      supabase
        .from("v_place_last_room_transition")
        .select("place_id")
        .eq("room_id", roomId),
      supabase
        .from("furniture")
        .select(
          "id, name, photo_url, created_at, deleted_at, room_id, furniture_type_id"
        )
        .eq("room_id", roomId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    ]);

  const { data: roomData, error: roomError } = roomResult;
  if (roomError) {
    return { error: roomError.message, status: 500 };
  }
  if (!roomData) {
    return { error: "Помещение не найдено", status: 404 };
  }

  const entityType = normalizeEntityTypeRelation(roomData.entity_types);
  const buildingsData = roomData.buildings;
  const buildingData =
    Array.isArray(buildingsData) && buildingsData.length > 0
      ? buildingsData[0]
      : buildingsData && !Array.isArray(buildingsData)
        ? buildingsData
        : null;
  const room: RoomDetailData["room"] = {
    id: roomData.id,
    name: roomData.name,
    photo_url: roomData.photo_url,
    created_at: roomData.created_at,
    deleted_at: roomData.deleted_at,
    room_type_id: roomData.room_type_id ?? null,
    room_type: entityType?.name ? { name: entityType.name } : null,
    building_id: roomData.building_id ?? null,
    building_name: buildingData?.name ?? null,
  };

  const itemIds: number[] = Array.isArray(itemIdsResult.data)
    ? itemIdsResult.data
        .map((row: { item_id?: number }) => Number(row?.item_id ?? 0))
        .filter((id) => id > 0)
    : [];

  const allTransitionsData = transitionsResult.data ?? [];
  const placeIdsFromMv = (placesInRoomMv.data ?? []).map(
    (r: { place_id: number }) => r.place_id
  );
  const containerTransitionsMap = new Map<number, Transition>();
  allTransitionsData.forEach((t) => {
    if (t.container_id && !containerTransitionsMap.has(t.container_id)) {
      containerTransitionsMap.set(t.container_id, t as Transition);
    }
  });
  const placeIds = placeIdsFromMv.length > 0 ? placeIdsFromMv : [];
  const containerIds = Array.from(containerTransitionsMap.keys());

  const transitionColumns =
    "place_id, container_id, destination_type, destination_id, created_at";
  const [itemsResult, containerTransitionsResult] = await Promise.all([
    itemIds.length > 0
      ? supabase
          .from("items")
          .select("id, name, photo_url, created_at, deleted_at")
          .in("id", itemIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    containerIds.length > 0
      ? supabase
          .from("transitions")
          .select(transitionColumns)
          .in("container_id", containerIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const roomItems: Item[] = (itemsResult.data ?? []) as Item[];
  const placesInRoom = placeIds;

  const lastContainerTransitions = new Map<number, Transition>();
  (containerTransitionsResult.data || []).forEach((t) => {
    if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
      lastContainerTransitions.set(t.container_id, t as Transition);
    }
  });
  const containersInRoom = Array.from(lastContainerTransitions.entries())
    .filter(
      ([, transition]) =>
        transition.destination_type === "room" &&
        transition.destination_id === roomId
    )
    .map(([containerId]) => containerId);

  const [placesResult, containersResult] = await Promise.all([
    placesInRoom.length > 0
      ? supabase
          .from("places")
          .select("id, name, photo_url, created_at, deleted_at, entity_type_id")
          .in("id", placesInRoom)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    containersInRoom.length > 0
      ? supabase
          .from("containers")
          .select("id, name, photo_url, created_at, deleted_at, entity_type_id")
          .in("id", containersInRoom)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const roomPlaces: Place[] = (placesResult.data ?? []) as Place[];
  const roomContainers: Container[] = (containersResult.data ?? []) as Container[];

  const furnitureRows = furnitureResult.data ?? [];
  const roomFurniture: Furniture[] = furnitureRows.map(
    (f: {
      id: number;
      name: string | null;
      photo_url: string | null;
      created_at: string;
      deleted_at: string | null;
      room_id: number;
      furniture_type_id: number | null;
    }) => ({
      id: f.id,
      name: f.name,
      photo_url: f.photo_url,
      created_at: f.created_at,
      deleted_at: f.deleted_at,
      room_id: f.room_id,
      furniture_type_id: f.furniture_type_id ?? null,
    })
  );

  return {
    room,
    items: roomItems,
    places: roomPlaces,
    containers: roomContainers,
    furniture: roomFurniture,
  };
}
