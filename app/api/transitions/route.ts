import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { parseId } from "@/lib/shared/api/parse-id";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { PLACE_DESTINATION_FURNITURE_ONLY } from "@/lib/places/validation-messages";
import { transitionBodySchema } from "@/lib/shared/api/schemas/transition-body";
import type { DestinationType } from "@/types/entity";

function getSourceValidationResponse(
  item_id: unknown, place_id: unknown, container_id: unknown,
  itemId: number | undefined, placeId: number | undefined, containerId: number | undefined
): NextResponse | null {
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
  return null;
}

const parseOptionalId = (value: unknown): number | undefined => {
  if (value == null || value === "") return undefined;
  const id = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isNaN(id) || id <= 0 ? undefined : id;
};

function parseAndValidateBody(body: unknown): {
  success: boolean;
  data?: {
    item_id?: unknown;
    place_id?: unknown;
    container_id?: unknown;
    destination_type: DestinationType;
    destination_id: unknown;
  };
  errorResponse?: NextResponse;
} {
  const parsed = transitionBodySchema.safeParse(body);
  if (!parsed.success) {
    const issues = "issues" in parsed.error ? parsed.error.issues : [];
    const first = Array.isArray(issues) ? issues[0] : null;
    const message =
      first && typeof first === "object" && "message" in first
        ? String(first.message)
        : String(parsed.error.message ?? "Неверный формат тела запроса");
    return {
      success: false,
      errorResponse: NextResponse.json({ error: message }, { status: HTTP_STATUS.BAD_REQUEST }),
    };
  }
  return { success: true, data: parsed.data };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const body = await request.json();

    const validationResult = parseAndValidateBody(body);
    if (!validationResult.success || !validationResult.data) {
      if (validationResult.errorResponse) return validationResult.errorResponse;
      return NextResponse.json({ error: "Неверный формат" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const { item_id, place_id, container_id, destination_type, destination_id } = validationResult.data;
    const validatedDestType = destination_type;

    if (place_id && validatedDestType !== "furniture") {
      return NextResponse.json(
        { error: PLACE_DESTINATION_FURNITURE_ONLY },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const destIdResult = parseId(String(destination_id), { entityLabel: "назначения" });
    if (destIdResult instanceof NextResponse) return destIdResult;



    const transitionData: {
      destination_type: DestinationType;
      destination_id: number;
      tenant_id: number;
      item_id?: number;
      place_id?: number;
      container_id?: number;
    } = {
      destination_type: validatedDestType,
      destination_id: destIdResult.id,
      tenant_id: tenantId,
    };

    const itemId = parseOptionalId(item_id);
    const placeId = parseOptionalId(place_id);
    const containerId = parseOptionalId(container_id);

    const validationResponse = getSourceValidationResponse(
      item_id, place_id, container_id,
      itemId, placeId, containerId
    );
    if (validationResponse) return validationResponse;

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
