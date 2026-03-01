import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { normalizeSortParams } from "@/lib/shared/api/list-params";
import { getRoomsWithCountsRpc } from "@/lib/rooms/api";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { parseOptionalInt } from "@/lib/shared/api/parse-optional-int";
import { parseOptionalBool } from "@/lib/shared/api/parse-optional-bool";
import { DEFAULT_PAGE_LIMIT } from "@/lib/shared/api/constants";
import type { Room } from "@/types/entity";
import type { RoomRow } from "@/types/db-rows";

/**
 * Handle GET requests to list rooms with counts, supporting search, deleted visibility, and sorting.
 *
 * @param request - Incoming NextRequest whose query parameters may include `query`, `showDeleted`, `sortBy`, and `sortDirection`
 * @returns A JSON response with either `{ data: Room[] }` on success or `{ error: string }` on failure
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const hasItems = parseOptionalBool(searchParams.get("hasItems"));
    const hasContainers = parseOptionalBool(searchParams.get("hasContainers"));
    const hasPlaces = parseOptionalBool(searchParams.get("hasPlaces"));
    const filterBuildingId = parseOptionalInt(searchParams.get("buildingId"));
    const { sortBy, sortDirection } = normalizeSortParams(
      searchParams.get("sortBy"),
      searchParams.get("sortDirection")
    );

    const { data: roomsData, error: fetchError } = await getRoomsWithCountsRpc(supabase, {
      search_query: query?.trim() || null,
      show_deleted: showDeleted,
      page_limit: DEFAULT_PAGE_LIMIT,
      page_offset: 0,
      sort_by: sortBy,
      sort_direction: sortDirection,
      has_items: hasItems,
      has_containers: hasContainers,
      has_places: hasPlaces,
      filter_building_id: filterBuildingId,
      filter_tenant_id: tenantId,
    });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

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
      furniture_count: room.furniture_count ?? 0,
    }));

    return NextResponse.json({
      data: rooms,
      totalCount,
    });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки списка помещений:",
      defaultMessage: "Произошла ошибка при загрузке данных",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const body = await request.json();
    const { name, photo_url, room_type_id, building_id } = body;

    const insertData: {
      name: string | null;
      photo_url: string | null;
      room_type_id: number | null;
      building_id: number | null;
      tenant_id: number;
    } = {
      name: name?.trim() || null,
      photo_url: photo_url || null,
      room_type_id: room_type_id != null ? (Number(room_type_id) || null) : null,
      building_id: building_id != null ? (Number(building_id) || null) : null,
      tenant_id: tenantId,
    };

    const { data: newRoom, error: insertError } = await supabase
      .from("rooms")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({ data: newRoom });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка создания помещения:",
      defaultMessage: "Произошла ошибка при создании помещения",
    });
  }
}