import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { normalizeSortParams } from "@/lib/shared/api/list-params";
import { insertEntityWithTransition } from "@/lib/shared/api/insert-entity-with-transition";
import { getContainersWithLocationRpc } from "@/lib/containers/api";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { parseOptionalInt } from "@/lib/shared/api/parse-optional-int";
import { DEFAULT_PAGE_LIMIT } from "@/lib/shared/api/constants";
import type { Container } from "@/types/entity";

/**
 * Retrieve a list of containers with optional search, deleted filtering, sorting, and last-location data.
 *
 * Requires an authenticated user; responds with a 401 JSON error if the request is unauthenticated.
 *
 * @returns `{ data: Container[] }` on success, or `{ error: string }` with an appropriate HTTP status on failure.
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
    const entityTypeId = parseOptionalInt(searchParams.get("entityTypeId"));
    const hasItemsParam = searchParams.get("hasItems");
    const hasItems =
      hasItemsParam === null || hasItemsParam === ""
        ? null
        : hasItemsParam === "true";
    const locationTypeParam = searchParams.get("locationType");
    const locationType =
      locationTypeParam !== null && locationTypeParam !== "" && locationTypeParam !== "all"
        ? locationTypeParam
        : null;
    const placeId = parseOptionalInt(searchParams.get("placeId"));
    const furnitureId = parseOptionalInt(searchParams.get("furnitureId"));
    const { sortBy, sortDirection } = normalizeSortParams(
      searchParams.get("sortBy"),
      searchParams.get("sortDirection")
    );

    const { data: containersData, error: fetchError } = await getContainersWithLocationRpc(supabase, {
      search_query: query?.trim() || null,
      show_deleted: showDeleted,
      page_limit: DEFAULT_PAGE_LIMIT,
      page_offset: 0,
      sort_by: sortBy,
      sort_direction: sortDirection,
      p_entity_type_id: entityTypeId,
      p_has_items: hasItems,
      p_destination_type: locationType,
      p_place_id: placeId,
      filter_tenant_id: tenantId,
      p_furniture_id: furnitureId,
    });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!containersData || containersData.length === 0) {
      return NextResponse.json({
        data: [],
      });
    }

    const containers: Container[] = containersData.map((container: {
      id: number;
      name: string | null;
      entity_type_id: number | null;
      entity_type_name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      items_count: number;
      destination_type: string | null;
      destination_id: number | null;
      destination_name: string | null;
      moved_at: string | null;
      room_id: number | null;
      room_name: string | null;
    }) => ({
      id: container.id,
      name: container.name,
      entity_type_id: container.entity_type_id || null,
      entity_type: container.entity_type_name
        ? { name: container.entity_type_name }
        : null,
      created_at: container.created_at,
      deleted_at: container.deleted_at,
      photo_url: container.photo_url,
      itemsCount: container.items_count ?? 0,
      last_location: container.destination_type
        ? {
            destination_type: container.destination_type,
            destination_id: container.destination_id,
            destination_name: container.destination_name,
            moved_at: container.moved_at,
            room_name: container.room_name ?? null,
          }
        : null,
    }));

    return NextResponse.json({
      data: containers,
    });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки списка контейнеров:",
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
    const { name, entity_type_id, photo_url, destination_type, destination_id } = body;

    const insertData = {
      name: name?.trim() || null,
      entity_type_id: entity_type_id || null,
      photo_url: photo_url || null,
      tenant_id: tenantId,
    };

    const transitionPayload =
      destination_type && destination_id
        ? {
            destination_type,
            destination_id: parseInt(destination_id, 10),
            tenant_id: tenantId,
          }
        : null;

    const result = await insertEntityWithTransition({
      supabase,
      table: "containers",
      insertData,
      transitionPayload,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка создания контейнера:",
      defaultMessage: "Произошла ошибка при создании контейнера",
    });
  }
}