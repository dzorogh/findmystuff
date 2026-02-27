import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { requireIdParam } from "@/lib/shared/api/require-id-param";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { loadRoomDetail } from "@/lib/rooms/load-room-detail";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const idResult = await requireIdParam(params, { entityLabel: "помещения" });
    if (idResult instanceof NextResponse) return idResult;
    const roomId = idResult.id;
    const supabase = await createClient();

    const result = await loadRoomDetail(supabase, roomId);
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json({ data: result });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки данных помещения:",
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
    const idResult = await requireIdParam(params, { entityLabel: "помещения" });
    if (idResult instanceof NextResponse) return idResult;
    const roomId = idResult.id;
    const supabase = await createClient();

    const body = await request.json();
    const { name, photo_url, room_type_id, building_id } = body;

    const updateData: {
      name?: string | null;
      photo_url?: string | null;
      room_type_id?: number | null;
      building_id?: number | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;
    if (room_type_id !== undefined) updateData.room_type_id = room_type_id != null ? (Number(room_type_id) || null) : null;
    if (building_id !== undefined) updateData.building_id = building_id != null ? (Number(building_id) || null) : null;

    const { data, error } = await supabase
      .from("rooms")
      .update(updateData)
      .eq("id", roomId)
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
      context: "Ошибка обновления помещения:",
      defaultMessage: "Произошла ошибка при обновлении помещения",
    });
  }
}
