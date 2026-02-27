import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { normalizeEntityTypeRelation } from "@/lib/shared/api/normalize-entity-type-relation";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { requireIdParam } from "@/lib/shared/api/require-id-param";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import type { Building } from "@/types/entity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const idResult = await requireIdParam(params, { entityLabel: "здания" });
    if (idResult instanceof NextResponse) return idResult;
    const buildingId = idResult.id;
    const supabase = await createClient();

    const { data: buildingData, error: buildingError } = await supabase
      .from("buildings")
      .select("id, name, photo_url, created_at, deleted_at, building_type_id, entity_types(name)")
      .eq("id", buildingId)
      .single();

    if (buildingError || !buildingData) {
      return NextResponse.json(
        { error: buildingError?.message ?? "Здание не найдено" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const entityType = normalizeEntityTypeRelation(buildingData.entity_types);

    const building: Building = {
      id: buildingData.id,
      name: buildingData.name,
      photo_url: buildingData.photo_url,
      created_at: buildingData.created_at,
      deleted_at: buildingData.deleted_at,
      building_type_id: buildingData.building_type_id ?? null,
      building_type: entityType?.name ? { name: entityType.name } : null,
    };

    const { data: roomsData } = await supabase
      .from("rooms")
      .select("id, name, room_type_id")
      .eq("building_id", buildingId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const rooms = (roomsData ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      room_type_id: r.room_type_id ?? null,
    }));

    return NextResponse.json({
      data: { building, rooms },
    });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки данных здания:",
      defaultMessage: "Произошла ошибка при загрузке данных",
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const idResult = await requireIdParam(params, { entityLabel: "здания" });
    if (idResult instanceof NextResponse) return idResult;
    const buildingId = idResult.id;
    const supabase = await createClient();

    const body = await request.json();
    const { name, photo_url, building_type_id } = body;

    const updateData: {
      name?: string | null;
      photo_url?: string | null;
      building_type_id?: number | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;
    if (building_type_id !== undefined)
      updateData.building_type_id = building_type_id != null ? (Number(building_type_id) || null) : null;

    const { data, error } = await supabase
      .from("buildings")
      .update(updateData)
      .eq("id", buildingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка обновления здания:",
      defaultMessage: "Произошла ошибка при обновлении здания",
    });
  }
}
