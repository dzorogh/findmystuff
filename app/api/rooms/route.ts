import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { normalizeSortParams } from "@/lib/shared/api/list-params";
import { getRoomsWithCountsRpc } from "@/lib/rooms/api";
import { getServerUser } from "@/lib/users/server";
import type { Room } from "@/types/entity";

/**
 * Handle GET requests to list rooms with counts, supporting search, deleted visibility, and sorting.
 *
 * @param request - Incoming NextRequest whose query parameters may include `query`, `showDeleted`, `sortBy`, and `sortDirection`
 * @returns A JSON response with either `{ data: Room[] }` on success or `{ error: string }` on failure
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const hasItemsParam = searchParams.get("hasItems");
    const hasItems =
      hasItemsParam === null || hasItemsParam === ""
        ? null
        : hasItemsParam === "true";
    const hasContainersParam = searchParams.get("hasContainers");
    const hasContainers =
      hasContainersParam === null || hasContainersParam === ""
        ? null
        : hasContainersParam === "true";
    const hasPlacesParam = searchParams.get("hasPlaces");
    const hasPlaces =
      hasPlacesParam === null || hasPlacesParam === ""
        ? null
        : hasPlacesParam === "true";
    const buildingIdParam = searchParams.get("buildingId");
    const buildingId =
      buildingIdParam === null || buildingIdParam === ""
        ? null
        : parseInt(buildingIdParam, 10);
    const filterBuildingId =
      buildingId != null && !Number.isNaN(buildingId) ? buildingId : null;
    const { sortBy, sortDirection } = normalizeSortParams(
      searchParams.get("sortBy"),
      searchParams.get("sortDirection")
    );

    const { data: roomsData, error: fetchError } = await getRoomsWithCountsRpc(supabase, {
      search_query: query?.trim() || null,
      show_deleted: showDeleted,
      page_limit: 2000,
      page_offset: 0,
      sort_by: sortBy,
      sort_direction: sortDirection,
      has_items: hasItems,
      has_containers: hasContainers,
      has_places: hasPlaces,
      filter_building_id: filterBuildingId,
    });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    type RoomRow = {
      id: number;
      name: string | null;
      room_type_id: number | null;
      room_type_name: string | null;
      building_id: number | null;
      building_name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      items_count: number;
      places_count: number;
      containers_count: number;
      total_count?: number;
    };

    if (!roomsData || roomsData.length === 0) {
      return NextResponse.json({
        data: [],
        totalCount: 0,
      });
    }

    const rows = roomsData as RoomRow[];
    const totalCount =
      rows[0]?.total_count != null ? Number(rows[0].total_count) : rows.length;

    const rooms: Room[] = rows.map((room) => ({
      id: room.id,
      name: room.name,
      room_type_id: room.room_type_id ?? null,
      room_type: room.room_type_name ? { name: room.room_type_name } : null,
      building_id: room.building_id ?? null,
      building_name: room.building_name ?? null,
      created_at: room.created_at,
      deleted_at: room.deleted_at,
      photo_url: room.photo_url,
      items_count: room.items_count ?? 0,
      places_count: room.places_count ?? 0,
      containers_count: room.containers_count ?? 0,
    }));

    return NextResponse.json({
      data: rooms,
      totalCount,
    });
  } catch (error) {
    console.error("Ошибка загрузки списка помещений:", error);
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
    const supabase = await createClient();

    const body = await request.json();
    const { name, photo_url, room_type_id, building_id } = body;

    const insertData: {
      name: string | null;
      photo_url: string | null;
      room_type_id: number | null;
      building_id: number | null;
    } = {
      name: name?.trim() || null,
      photo_url: photo_url || null,
      room_type_id: room_type_id != null ? (Number(room_type_id) || null) : null,
      building_id: building_id != null ? (Number(building_id) || null) : null,
    };

    const { data: newRoom, error: insertError } = await supabase
      .from("rooms")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newRoom });
  } catch (error) {
    console.error("Ошибка создания помещения:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при создании помещения",
      },
      { status: 500 }
    );
  }
}