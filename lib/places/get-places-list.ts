/**
 * Загрузка списка мест для GET /api/places.
 * RPC get_places_with_room с fallback на прямой запрос при отсутствии колонки.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GetPlacesListParams, SortBy, SortDirection } from "@/types/api";
import type { Place, RpcPlaceRow } from "@/types/entity";
import { normalizeEntityTypeRelation } from "@/lib/shared/api/normalize-entity-type-relation";
import { getPlacesWithRoomRpc } from "@/lib/places/api";
import { DEFAULT_PAGE_LIMIT } from "@/lib/shared/api/constants";

export type { GetPlacesListParams } from "@/types/api";
export type { RpcPlaceRow } from "@/types/entity";

const CODE_COLUMN_MISSING_ERROR = 'column "code" does not exist';

type EntityTypeRelation = { name: string | null };

type FallbackPlaceRow = {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  entity_type: EntityTypeRelation | EntityTypeRelation[] | null;
};

export const mapRpcPlaceToPlace = (place: RpcPlaceRow): Place => ({
  id: place.id,
  name: place.name,
  entity_type_id: place.entity_type_id || null,
  entity_type: place.entity_type_name
    ? { name: place.entity_type_name }
    : null,
  created_at: place.created_at,
  deleted_at: place.deleted_at,
  photo_url: place.photo_url,
  room_id: place.room_id ?? null,
  room_name: place.room_name ?? null,
  furniture_id: place.furniture_id ?? null,
  furniture_name: place.furniture_name ?? null,
  room: place.room_id
    ? { id: place.room_id, name: place.room_name || null }
    : null,
  items_count: place.items_count ?? 0,
  containers_count: place.containers_count ?? 0,
});

const buildCountMap = (rows: Array<{ destination_id: number | null }>) => {
  const counts = new Map<number, number>();
  rows.forEach((row) => {
    if (typeof row.destination_id !== "number") return;
    counts.set(row.destination_id, (counts.get(row.destination_id) ?? 0) + 1);
  });
  return counts;
};

/** Строит и выполняет запрос мест для fallback (без RPC). */
async function executeFallbackPlacesQuery(
  supabase: SupabaseClient,
  showDeleted: boolean,
  sortBy: SortBy,
  sortDirection: SortDirection,
  entityTypeId: number | null,
  roomId: number | null
): Promise<{ data: FallbackPlaceRow[] | null; error: string | null }> {
  let fallbackQuery = supabase
    .from("places")
    .select(
      "id, name, entity_type_id, created_at, deleted_at, photo_url, entity_type:entity_types(name)"
    )
    .order(sortBy === "name" ? "name" : "created_at", {
      ascending: sortDirection === "asc",
    })
    .limit(DEFAULT_PAGE_LIMIT);

  fallbackQuery = showDeleted
    ? fallbackQuery.not("deleted_at", "is", null)
    : fallbackQuery.is("deleted_at", null);

  if (entityTypeId != null) {
    fallbackQuery = fallbackQuery.eq("entity_type_id", entityTypeId);
  }

  if (roomId != null) {
    const { data: placeIdsInRoom } = await supabase
      .from("v_place_last_room_transition")
      .select("place_id")
      .eq("room_id", roomId);
    const ids = (placeIdsInRoom ?? []).map((r: { place_id: number }) => r.place_id);
    if (ids.length === 0) {
      return { data: [], error: null };
    }
    fallbackQuery = fallbackQuery.in("id", ids);
  }

  const { data: fallbackRows, error: fallbackError } = await fallbackQuery;
  if (fallbackError) {
    return { data: null, error: fallbackError.message };
  }
  return { data: (fallbackRows || []) as FallbackPlaceRow[], error: null };
}

/** Загружает карты roomNameById, roomIdByPlaceId и счётчики items/containers по placeIds. */
async function loadPlaceRoomAndCountMaps(
  supabase: SupabaseClient,
  placeIds: number[]
): Promise<{
  roomNameById: Map<number, string | null>;
  roomIdByPlaceId: Map<number, number>;
  itemCounts: Map<number, number>;
  containerCounts: Map<number, number>;
}> {
  const [placeTransitionsResult, itemTransitionsResult, containerTransitionsResult] =
    await Promise.all([
      supabase
        .from("v_place_last_room_transition")
        .select("place_id, room_id")
        .in("place_id", placeIds),
      supabase
        .from("mv_item_last_transition")
        .select("destination_id")
        .eq("destination_type", "place")
        .in("destination_id", placeIds),
      supabase
        .from("mv_container_last_transition")
        .select("destination_id")
        .eq("destination_type", "place")
        .in("destination_id", placeIds),
    ]);

  const placeTransitions = (placeTransitionsResult.data || []) as Array<{
    place_id: number;
    room_id: number | null;
  }>;
  const roomIds = Array.from(
    new Set(
      placeTransitions
        .map((t) => t.room_id)
        .filter((id): id is number => typeof id === "number")
    )
  );

  const roomNameById = new Map<number, string | null>();
  if (roomIds.length > 0) {
    const { data: roomRows } = await supabase
      .from("rooms")
      .select("id, name")
      .is("deleted_at", null)
      .in("id", roomIds);
    (roomRows || []).forEach((room) => {
      roomNameById.set(room.id as number, (room.name as string | null) || null);
    });
  }

  const roomIdByPlaceId = new Map<number, number>();
  placeTransitions.forEach((t) => {
    if (typeof t.room_id !== "number") return;
    roomIdByPlaceId.set(t.place_id, t.room_id);
  });

  const itemCounts = buildCountMap(
    (itemTransitionsResult.data || []) as Array<{ destination_id: number | null }>
  );
  const containerCounts = buildCountMap(
    (containerTransitionsResult.data ||
      []) as Array<{ destination_id: number | null }>
  );

  return { roomNameById, roomIdByPlaceId, itemCounts, containerCounts };
}

async function fetchPlacesFallback(
  supabase: SupabaseClient,
  query: string | null,
  showDeleted: boolean,
  sortBy: SortBy,
  sortDirection: SortDirection,
  entityTypeId: number | null,
  roomId: number | null
): Promise<{ data: Place[] | null; error: string | null }> {
  const { data: fallbackRows, error: queryError } = await executeFallbackPlacesQuery(
    supabase,
    showDeleted,
    sortBy,
    sortDirection,
    entityTypeId,
    roomId
  );
  if (queryError) return { data: null, error: queryError };
  if (!fallbackRows || fallbackRows.length === 0) {
    return { data: [], error: null };
  }

  const normalizedQuery = query?.trim().toLowerCase();
  const filteredRows = fallbackRows.filter((place) => {
    if (!normalizedQuery) return true;
    const entityType = normalizeEntityTypeRelation(place.entity_type);
    return (
      (place.name || "").toLowerCase().includes(normalizedQuery) ||
      (entityType?.name || "").toLowerCase().includes(normalizedQuery)
    );
  });

  if (filteredRows.length === 0) {
    return { data: [], error: null };
  }

  const placeIds = filteredRows.map((place) => place.id);
  const { roomNameById, roomIdByPlaceId, itemCounts, containerCounts } =
    await loadPlaceRoomAndCountMaps(supabase, placeIds);

  const places: Place[] = filteredRows.map((place) => {
    const entityType = normalizeEntityTypeRelation(place.entity_type);
    const placeRoomId = roomIdByPlaceId.get(place.id);
    return {
      id: place.id,
      name: place.name,
      entity_type_id: place.entity_type_id || null,
      entity_type: entityType?.name ? { name: entityType.name } : null,
      created_at: place.created_at,
      deleted_at: place.deleted_at,
      photo_url: place.photo_url,
      room: placeRoomId
        ? { id: placeRoomId, name: roomNameById.get(placeRoomId) || null }
        : null,
      items_count: itemCounts.get(place.id) ?? 0,
      containers_count: containerCounts.get(place.id) ?? 0,
    };
  });

  return { data: places, error: null };
}

/**
 * Загружает список мест: RPC get_places_with_room с fallback при ошибке отсутствующей колонки.
 */
export async function getPlacesList(
  supabase: SupabaseClient,
  params: GetPlacesListParams
): Promise<{ data: Place[] | null; error: string | null }> {
  const {
    query,
    showDeleted,
    sortBy,
    sortDirection,
    entityTypeId,
    roomId,
    furnitureId,
    tenantId,
  } = params;

  const { data: placesData, error: fetchError } = await getPlacesWithRoomRpc(supabase, {
    search_query: query,
    show_deleted: showDeleted,
    page_limit: DEFAULT_PAGE_LIMIT,
    page_offset: 0,
    sort_by: sortBy,
    sort_direction: sortDirection,
    filter_entity_type_id: entityTypeId ?? undefined,
    filter_room_id: roomId ?? undefined,
    filter_furniture_id: furnitureId ?? undefined,
    filter_tenant_id: tenantId,
  });

  if (fetchError) {
    if (fetchError.message.includes(CODE_COLUMN_MISSING_ERROR)) {
      return fetchPlacesFallback(
        supabase,
        query,
        showDeleted,
        sortBy,
        sortDirection,
        entityTypeId,
        roomId
      );
    }
    return { data: null, error: fetchError.message };
  }

  if (!placesData || placesData.length === 0) {
    return { data: [], error: null };
  }

  const places: Place[] = (placesData as RpcPlaceRow[]).map(mapRpcPlaceToPlace);
  return { data: places, error: null };
}
