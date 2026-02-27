import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { parseId } from "@/lib/shared/api/parse-id";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { loadPlaceDetail } from "@/lib/places/load-place-detail";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const resolvedParams = await Promise.resolve(params);
    const idResult = parseId(resolvedParams.id, { entityLabel: "места" });
    if (idResult instanceof NextResponse) return idResult;
    const placeId = idResult.id;
    const supabase = await createClient();

    const result = await loadPlaceDetail(supabase, placeId);
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json({ data: result });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки данных места:",
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
    const resolvedParams = await Promise.resolve(params);
    const idResult = parseId(resolvedParams.id, { entityLabel: "места" });
    if (idResult instanceof NextResponse) return idResult;
    const placeId = idResult.id;
    const supabase = await createClient();

    const body = await request.json();
    const { name, entity_type_id, photo_url } = body;

    const updateData: {
      name?: string | null;
      entity_type_id?: number | null;
      photo_url?: string | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (entity_type_id !== undefined) updateData.entity_type_id = entity_type_id || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;

    const { data, error } = await supabase
      .from("places")
      .update(updateData)
      .eq("id", placeId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка обновления места:",
      defaultMessage: "Произошла ошибка при обновлении места",
    });
  }
}
