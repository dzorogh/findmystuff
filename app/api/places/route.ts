import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { parseOptionalInt } from "@/lib/shared/api/parse-optional-int";
import { insertEntityWithTransition } from "@/lib/shared/api/insert-entity-with-transition";
import { PLACE_DESTINATION_FURNITURE_ONLY } from "@/lib/places/validation-messages";
import { normalizeSortParams } from "@/lib/shared/api/list-params";
import { getPlacesList } from "@/lib/places/get-places-list";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
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

    const { data: places, error } = await getPlacesList(supabase, {
      query,
      showDeleted,
      sortBy,
      sortDirection,
      entityTypeId,
      roomId,
      furnitureId,
      tenantId,
    });

    if (error) {
      return NextResponse.json(
        { error },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({
      data: places ?? [],
    });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки списка мест:",
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

    if (destination_type && destination_type !== "furniture") {
      return NextResponse.json(
        { error: PLACE_DESTINATION_FURNITURE_ONLY },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

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
      table: "places",
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
      context: "Ошибка создания места:",
      defaultMessage: "Произошла ошибка при создании места",
    });
  }
}
