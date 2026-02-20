import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getSupabaseAdmin } from "@/lib/shared/supabase/admin";
import { normalizeSortParams, type SortBy, type SortDirection } from "@/lib/shared/api/list-params";
import { getPlacesWithRoomRpc } from "@/lib/places/api";
import { getServerUser } from "@/lib/users/server";
import { getActiveTenantId } from "@/lib/tenants/server";
import type { Place } from "@/types/entity";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type RpcPlaceRow = {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  entity_type_name: string | null;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
  room_id: number | null;
  room_name: string | null;
  furniture_id: number | null;
  furniture_name: string | null;
  items_count: number;
  containers_count: number;
};

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

const CODE_COLUMN_MISSING_ERROR = 'column "code" does not exist';

const getEntityTypeRelation = (
  relation: EntityTypeRelation | EntityTypeRelation[] | null | undefined
): EntityTypeRelation | null => {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
};

const mapRpcPlaceToPlace = (place: RpcPlaceRow): Place => ({
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
    ? {
        room_id: place.room_id,
        room_name: place.room_name || null,
      }
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

const parseOptionalInt = (value: string | null): number | null => {
  if (value == null || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
};

const fetchPlacesFallback = async (
  supabase: SupabaseClient,
  admin: ReturnType<typeof getSupabaseAdmin>,
  query: string | null,
  showDeleted: boolean,
  sortBy: SortBy,
  sortDirection: SortDirection,
  entityTypeId: number | null,
  roomId: number | null
) => {
  let fallbackQuery = supabase
    .from("places")
    .select("id, name, entity_type_id, created_at, deleted_at, photo_url, entity_type:entity_types(name)")
    .order(sortBy === "name" ? "name" : "created_at", { ascending: sortDirection === "asc" })
    .limit(2000);

  fallbackQuery = showDeleted
    ? fallbackQuery.not("deleted_at", "is", null)
    : fallbackQuery.is("deleted_at", null);

  if (entityTypeId != null) {
    fallbackQuery = fallbackQuery.eq("entity_type_id", entityTypeId);
  }

  if (roomId != null) {
    const { data: placeIdsInRoom } = await admin
      .from("mv_place_last_room_transition")
      .select("place_id")
      .eq("room_id", roomId);
    const ids = (placeIdsInRoom ?? []).map((r: { place_id: number }) => r.place_id);
    if (ids.length === 0) {
      return { data: [] as Place[], error: null };
    }
    fallbackQuery = fallbackQuery.in("id", ids);
  }

  const { data: fallbackRows, error: fallbackError } = await fallbackQuery;
  if (fallbackError) {
    return { data: null, error: fallbackError.message };
  }

  const normalizedQuery = query?.trim().toLowerCase();
  const filteredRows = ((fallbackRows || []) as FallbackPlaceRow[]).filter((place) => {
    if (!normalizedQuery) return true;
    const entityType = getEntityTypeRelation(place.entity_type);
    return (
      (place.name || "").toLowerCase().includes(normalizedQuery) ||
      (entityType?.name || "").toLowerCase().includes(normalizedQuery)
    );
  });

  if (filteredRows.length === 0) {
    return { data: [] as Place[], error: null };
  }

  const placeIds = filteredRows.map((place) => place.id);
  const [placeTransitionsResult, itemTransitionsResult, containerTransitionsResult] =
    await Promise.all([
      admin
        .from("mv_place_last_room_transition")
        .select("place_id, room_id")
        .in("place_id", placeIds),
      admin
        .from("mv_item_last_transition")
        .select("destination_id")
        .eq("destination_type", "place")
        .in("destination_id", placeIds),
      admin
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
        .map((transition) => transition.room_id)
        .filter((roomId): roomId is number => typeof roomId === "number")
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
  placeTransitions.forEach((transition) => {
    if (typeof transition.room_id !== "number") return;
    roomIdByPlaceId.set(transition.place_id, transition.room_id);
  });

  const itemCounts = buildCountMap(
    ((itemTransitionsResult.data || []) as Array<{ destination_id: number | null }>)
  );
  const containerCounts = buildCountMap(
    ((containerTransitionsResult.data || []) as Array<{ destination_id: number | null }>)
  );

  const places: Place[] = filteredRows.map((place) => {
    const entityType = getEntityTypeRelation(place.entity_type);
    const roomId = roomIdByPlaceId.get(place.id);
    return {
      id: place.id,
      name: place.name,
      entity_type_id: place.entity_type_id || null,
      entity_type: entityType?.name ? { name: entityType.name } : null,
      created_at: place.created_at,
      deleted_at: place.deleted_at,
      photo_url: place.photo_url,
      room: roomId
        ? {
            room_id: roomId,
            room_name: roomNameById.get(roomId) || null,
          }
        : null,
      items_count: itemCounts.get(place.id) ?? 0,
      containers_count: containerCounts.get(place.id) ?? 0,
    };
  });

  return { data: places, error: null };
};

/**
 * List places, optionally filtered by text, including deleted items, and sorted.
 *
 * Calls a Supabase RPC to retrieve places with their room data; falls back to a client-side query when the RPC fails due to a missing column. Requires an authenticated user and returns HTTP responses describing the result.
 *
 * @param request - Incoming request whose URL may include query parameters:
 *   - `query`: text to search in place name or entity type name
 *   - `showDeleted`: `"true"` to include deleted places
 *   - `sortBy`: field to sort by (e.g., `name` or `created_at`)
 *   - `sortDirection`: `asc` or `desc`
 * @returns On success, a JSON object with `data` containing an array of `Place` objects. If the user is not authenticated, returns a 401 response with an `error` message. On server or database errors, returns a 500 response with an `error` message.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const tenantId = await getActiveTenantId(request.headers);
    if (!tenantId) {
      return NextResponse.json(
        { error: "Выберите тенант или создайте склад" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const entityTypeId = parseOptionalInt(searchParams.get("entityTypeId"));
    const roomId = parseOptionalInt(searchParams.get("roomId"));
    const furnitureId = parseOptionalInt(searchParams.get("furnitureId"));
    const { sortBy, sortDirection } = normalizeSortParams(
      searchParams.get("sortBy"),
      searchParams.get("sortDirection")
    );

    const { data: placesData, error: fetchError } = await getPlacesWithRoomRpc(supabase, {
      search_query: query,
      show_deleted: showDeleted,
      page_limit: 2000,
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
        const { data: fallbackPlaces, error: fallbackError } =
          await fetchPlacesFallback(supabase, getSupabaseAdmin(), query, showDeleted, sortBy, sortDirection, entityTypeId, roomId);

        if (fallbackError) {
          return NextResponse.json(
            { error: fallbackError },
            { status: 500 }
          );
        }

        return NextResponse.json({
          data: fallbackPlaces || [],
        });
      }

      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!placesData || placesData.length === 0) {
      return NextResponse.json({
        data: [],
      });
    }

    const places: Place[] = (placesData as RpcPlaceRow[]).map(mapRpcPlaceToPlace);

    return NextResponse.json({
      data: places,
    });
  } catch (error) {
    console.error("Ошибка загрузки списка мест:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при загрузке данных",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const tenantId = await getActiveTenantId(request.headers);
    if (!tenantId) {
      return NextResponse.json(
        { error: "Выберите тенант или создайте склад" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const body = await request.json();
    const { name, entity_type_id, photo_url, destination_type, destination_id } = body;

    // Места привязываются только к мебели, не к помещениям напрямую
    if (destination_type && destination_type !== "furniture") {
      return NextResponse.json(
        { error: "Места можно привязывать только к мебели" },
        { status: 400 }
      );
    }

    const insertData: {
      name: string | null;
      entity_type_id: number | null;
      photo_url: string | null;
      tenant_id: number;
    } = {
      name: name?.trim() || null,
      entity_type_id: entity_type_id || null,
      photo_url: photo_url || null,
      tenant_id: tenantId,
    };

    const { data: newPlace, error: insertError } = await supabase
      .from("places")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Если указано местоположение, создаем transition
    if (destination_type && destination_id && newPlace) {
      const { error: transitionError } = await supabase
        .from("transitions")
        .insert({
          place_id: newPlace.id,
          destination_type,
          destination_id: parseInt(destination_id),
          tenant_id: tenantId,
        });

      if (transitionError) {
        // Удаляем созданное место, если не удалось создать transition
        await supabase.from("places").delete().eq("id", newPlace.id);
        return NextResponse.json(
          { error: transitionError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ data: newPlace });
  } catch (error) {
    console.error("Ошибка создания места:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при создании места",
      },
      { status: 500 }
    );
  }
}