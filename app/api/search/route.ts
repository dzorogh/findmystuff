import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/shared/api/constants";
import { mapNamedEntityToSearchHit } from "@/lib/search/mappers";
import { searchGlobalItemsByImage, searchGlobalItemsByText } from "@/lib/entities/items/search-service";
import type { SearchResponse } from "@/lib/search/types";

async function searchNamedEntities(
  request: NextRequest,
  query: string
): Promise<SearchResponse | NextResponse> {
  const auth = await requireAuthAndTenant(request);
  if (auth instanceof NextResponse) return auth;

  const { tenantId } = auth;
  const supabase = await createClient();
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      data: [],
      totalCount: 0,
      meta: {
        mode: "text",
        scope: "global",
        query: trimmedQuery,
        totalCount: 0,
        noMatches: true,
      },
    };
  }

  const [itemResults, placesResult, containersResult, roomsResult, furnitureResult, buildingsResult] =
    await Promise.all([
      searchGlobalItemsByText(supabase, tenantId, trimmedQuery),
      supabase
        .from("places")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .ilike("name", `%${trimmedQuery}%`)
        .is("deleted_at", null)
        .limit(10),
      supabase
        .from("containers")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .ilike("name", `%${trimmedQuery}%`)
        .is("deleted_at", null)
        .limit(10),
      supabase
        .from("rooms")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .ilike("name", `%${trimmedQuery}%`)
        .is("deleted_at", null)
        .limit(10),
      supabase
        .from("furniture")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .ilike("name", `%${trimmedQuery}%`)
        .is("deleted_at", null)
        .limit(10),
      supabase
        .from("buildings")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .ilike("name", `%${trimmedQuery}%`)
        .is("deleted_at", null)
        .limit(10),
    ]);

  const namedResults = [
    { entityType: "place" as const, data: placesResult.data, error: placesResult.error },
    { entityType: "container" as const, data: containersResult.data, error: containersResult.error },
    { entityType: "room" as const, data: roomsResult.data, error: roomsResult.error },
    { entityType: "furniture" as const, data: furnitureResult.data, error: furnitureResult.error },
    { entityType: "building" as const, data: buildingsResult.data, error: buildingsResult.error },
  ];

  for (const result of namedResults) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const namedHits = namedResults.flatMap((result) =>
    ((result.data as Array<{ id: number; name: string | null }> | null) ?? []).map(
      (entity) =>
        mapNamedEntityToSearchHit({
          entityType: result.entityType,
          entityId: entity.id,
          name: entity.name,
        })
    )
  );

  const hits = [...itemResults.data, ...namedHits];

  return {
    data: hits,
    totalCount: hits.length,
    meta: {
      mode: "text",
      scope: "global",
      query: trimmedQuery,
      totalCount: hits.length,
      noMatches: hits.length === 0,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json({
        data: [],
        totalCount: 0,
        meta: {
          mode: "text",
          scope: "global",
          query: query ?? "",
          totalCount: 0,
          noMatches: true,
        },
      });
    }

    const result = await searchNamedEntities(request, query);
    if (result instanceof NextResponse) {
      return result;
    }

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка поиска:",
      defaultMessage: "Произошла ошибка при поиске",
    });
  }
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

    const arrayBuffer = await file.arrayBuffer();
    const result = await searchGlobalItemsByImage(supabase, tenantId, {
      buffer: Buffer.from(arrayBuffer),
      mimeType: file.type,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка поиска по фото";

    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: message, data: [] },
        { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
      );
    }

    return apiErrorResponse(error, {
      context: "Ошибка поиска по фото:",
      defaultMessage: "Ошибка поиска по фото",
    });
  }
}
