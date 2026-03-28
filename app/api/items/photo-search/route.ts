import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/shared/api/constants";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { parseOptionalInt } from "@/lib/shared/api/parse-optional-int";
import { embedItemSearchImage } from "@/lib/shared/api/item-multimodal-embeddings-server";
import { searchItemsByEmbeddingRpc } from "@/lib/entities/api";
import {
  mapItemsRpcToItems,
  type ItemsRpcRow,
} from "@/lib/entities/helpers/map-items-rpc";

const ITEMS_PHOTO_SEARCH_LIMIT = 20;
const DEFAULT_SIMILARITY_THRESHOLD = 0.25;

function embeddingToVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;

    const { tenantId } = auth;
    const supabase = await createClient();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Файл не найден", data: [] },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением", data: [] },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 10MB", data: [] },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const locationTypeRaw = formData.get("locationType")?.toString() || null;
    const locationType =
      locationTypeRaw && locationTypeRaw !== "all" ? locationTypeRaw : null;
    const showDeleted = formData.get("showDeleted")?.toString() === "true";
    const entityTypeId = parseOptionalInt(formData.get("entityTypeId")?.toString() || null);
    const roomId = parseOptionalInt(formData.get("roomId")?.toString() || null);
    const placeId = parseOptionalInt(formData.get("placeId")?.toString() || null);
    const containerId = parseOptionalInt(formData.get("containerId")?.toString() || null);
    const furnitureId = parseOptionalInt(formData.get("furnitureId")?.toString() || null);
    const page = Math.max(
      parseInt(formData.get("page")?.toString() || "1", 10) || 1,
      1
    );
    const hasPhotoRaw = formData.get("hasPhoto")?.toString();
    const hasPhoto =
      hasPhotoRaw === "true" ? true : hasPhotoRaw === "false" ? false : null;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const queryEmbedding = await embedItemSearchImage(buffer, file.type, "query");

    const { data, error } = await searchItemsByEmbeddingRpc(supabase, {
      query_embedding_text: embeddingToVectorLiteral(queryEmbedding.embedding),
      filter_tenant_id: tenantId,
      show_deleted: showDeleted,
      page_limit: ITEMS_PHOTO_SEARCH_LIMIT,
      page_offset: (page - 1) * ITEMS_PHOTO_SEARCH_LIMIT,
      location_type: locationType,
      room_id: roomId,
      place_id: placeId,
      container_id: containerId,
      furniture_id: furnitureId,
      has_photo: hasPhoto,
      filter_item_type_id: entityTypeId,
      similarity_threshold: DEFAULT_SIMILARITY_THRESHOLD,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, data: [] },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({
        data: [],
        totalCount: 0,
        noSimilarFound: true,
      });
    }

    const rows = data as ItemsRpcRow[];
    return NextResponse.json({
      data: mapItemsRpcToItems(rows),
      totalCount: rows[0]?.total_count ?? 0,
      noSimilarFound: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка поиска вещей по фото";

    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: message, data: [] },
        { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
      );
    }

    return apiErrorResponse(error, {
      context: "Ошибка мультимодального поиска по фото:",
      defaultMessage: "Ошибка поиска вещей по фото",
    });
  }
}
