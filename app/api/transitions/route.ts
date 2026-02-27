import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { parseId } from "@/lib/shared/api/parse-id";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { PLACE_DESTINATION_FURNITURE_ONLY } from "@/lib/places/validation-messages";
import type { DestinationType } from "@/types/entity";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const body = await request.json();
    const { item_id, place_id, container_id, destination_type, destination_id } = body;

    if (!destination_type || !destination_id) {
      return NextResponse.json(
        { error: "Необходимы destination_type и destination_id" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Проверяем, что указан хотя бы один из item_id, place_id, container_id
    if (!item_id && !place_id && !container_id) {
      return NextResponse.json(
        { error: "Необходим хотя бы один из: item_id, place_id, container_id" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (place_id && destination_type !== "furniture") {
      return NextResponse.json(
        { error: PLACE_DESTINATION_FURNITURE_ONLY },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const destIdResult = parseId(String(destination_id), { entityLabel: "назначения" });
    if (destIdResult instanceof NextResponse) return destIdResult;

    const parseOptionalId = (value: unknown): number | undefined => {
      if (value == null || value === "") return undefined;
      const id = typeof value === "number" ? value : parseInt(String(value), 10);
      return Number.isNaN(id) || id <= 0 ? undefined : id;
    };

    const transitionData: {
      destination_type: DestinationType;
      destination_id: number;
      tenant_id: number;
      item_id?: number;
      place_id?: number;
      container_id?: number;
    } = {
      destination_type: destination_type as DestinationType,
      destination_id: destIdResult.id,
      tenant_id: tenantId,
    };

    const itemId = parseOptionalId(item_id);
    const placeId = parseOptionalId(place_id);
    const containerId = parseOptionalId(container_id);
    if (item_id != null && item_id !== "" && itemId == null) {
      return NextResponse.json({ error: "Некорректный item_id" }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    if (place_id != null && place_id !== "" && placeId == null) {
      return NextResponse.json({ error: "Некорректный place_id" }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    if (container_id != null && container_id !== "" && containerId == null) {
      return NextResponse.json({ error: "Некорректный container_id" }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    if (itemId == null && placeId == null && containerId == null) {
      return NextResponse.json(
        { error: "Необходим хотя бы один из: item_id, place_id, container_id" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    if (itemId != null) transitionData.item_id = itemId;
    if (placeId != null) transitionData.place_id = placeId;
    if (containerId != null) transitionData.container_id = containerId;

    const { data, error } = await supabase
      .from("transitions")
      .insert(transitionData)
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
      context: "Ошибка создания transition:",
      defaultMessage: "Произошла ошибка при создании transition",
    });
  }
}
