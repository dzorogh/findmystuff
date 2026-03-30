import type { SupabaseClient } from "@supabase/supabase-js";
import {
  embedItemSearchImage,
  embedItemSearchText,
  isItemMultimodalSearchConfigured,
} from "@/lib/shared/api/item-multimodal-embeddings-server";
import { searchItemsByEmbeddingRpc } from "@/lib/entities/api";
import {
  getItemSearchProjectionByIds,
  searchItemsByNameProjection,
} from "@/lib/entities/items/search-projection-server";
import { mapItemProjectionToSearchHit } from "@/lib/search/mappers";
import type { ItemSearchProjection, SearchResponse } from "@/lib/search/types";
import { logError } from "@/lib/shared/logger";
import type { ItemsRpcRow } from "@/types/entity";

const DEFAULT_ITEM_SEARCH_LIMIT = 10;
const DEFAULT_SIMILARITY_THRESHOLD = 0.25;

function embeddingToVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

function mergeItemProjections(
  semanticItems: ItemSearchProjection[],
  keywordItems: ItemSearchProjection[]
): ItemSearchProjection[] {
  const merged = new Map<number, ItemSearchProjection>();

  for (const item of semanticItems) {
    merged.set(item.id, item);
  }

  for (const item of keywordItems) {
    if (merged.has(item.id)) {
      const current = merged.get(item.id)!;
      merged.set(item.id, {
        ...item,
        search_match: current.search_match,
      });
      continue;
    }

    merged.set(item.id, {
      ...item,
      search_match: {
        similarity: 1,
        source: "keyword",
      },
    });
  }

  return Array.from(merged.values());
}

async function searchItemsByEmbeddingProjection(
  supabase: SupabaseClient,
  tenantId: number,
  params: {
    embedding: number[];
    limit?: number;
    page?: number;
    showDeleted?: boolean;
    similarityThreshold?: number;
  }
): Promise<{ items: ItemSearchProjection[]; totalCount: number }> {
  const limit = params.limit ?? DEFAULT_ITEM_SEARCH_LIMIT;
  const page = params.page ?? 1;
  const showDeleted = params.showDeleted === true;

  const { data, error } = await searchItemsByEmbeddingRpc(supabase, {
    query_embedding_text: embeddingToVectorLiteral(params.embedding),
    filter_tenant_id: tenantId,
    show_deleted: showDeleted,
    page_limit: limit,
    page_offset: (page - 1) * limit,
    location_type: null,
    room_id: null,
    place_id: null,
    container_id: null,
    furniture_id: null,
    has_photo: null,
    filter_item_type_id: null,
    similarity_threshold:
      params.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as ItemsRpcRow[] | null) ?? [];
  if (rows.length === 0) {
    return {
      items: [],
      totalCount: 0,
    };
  }

  const projections = await getItemSearchProjectionByIds(
    supabase,
    tenantId,
    rows.map((row) => row.id),
    { showDeleted }
  );

  const matchById = new Map(
    rows.map((row) => [
      row.id,
      row.similarity != null && row.match_source
        ? {
            similarity: row.similarity,
            source: row.match_source,
          }
        : null,
    ])
  );

  const items = projections.map((item) => ({
    ...item,
    search_match: matchById.get(item.id) ?? null,
  }));

  return {
    items,
    totalCount: rows[0]?.total_count ?? rows.length,
  };
}

export async function searchGlobalItemsByText(
  supabase: SupabaseClient,
  tenantId: number,
  query: string,
  options?: { limit?: number }
): Promise<SearchResponse> {
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

  const limit = options?.limit ?? DEFAULT_ITEM_SEARCH_LIMIT;
  const keywordItems = await searchItemsByNameProjection(supabase, tenantId, trimmedQuery, {
    limit,
  });

  if (!isItemMultimodalSearchConfigured()) {
    const keywordHits = keywordItems.map((item) =>
      mapItemProjectionToSearchHit({
        ...item,
        search_match: {
          similarity: 1,
          source: "keyword",
        },
      })
    );

    return {
      data: keywordHits,
      totalCount: keywordHits.length,
      meta: {
        mode: "text",
        scope: "global",
        query: trimmedQuery,
        totalCount: keywordHits.length,
        noMatches: keywordHits.length === 0,
      },
    };
  }

  try {
    const embedding = await embedItemSearchText(trimmedQuery);
    const semanticResult = await searchItemsByEmbeddingProjection(
      supabase,
      tenantId,
      {
        embedding: embedding.embedding,
        limit,
      }
    );

    const mergedItems = mergeItemProjections(semanticResult.items, keywordItems);
    const hits = mergedItems.map((item) =>
      mapItemProjectionToSearchHit(item, { semanticOnly: true })
    );

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
  } catch (error) {
    logError("Ошибка semantic text search для вещей, fallback на keyword:", error);

    const fallbackHits = keywordItems.map((item) =>
      mapItemProjectionToSearchHit({
        ...item,
        search_match: {
          similarity: 1,
          source: "keyword",
        },
      })
    );

    return {
      data: fallbackHits,
      totalCount: fallbackHits.length,
      meta: {
        mode: "text",
        scope: "global",
        query: trimmedQuery,
        totalCount: fallbackHits.length,
        noMatches: fallbackHits.length === 0,
      },
    };
  }
}

export async function searchGlobalItemsByImage(
  supabase: SupabaseClient,
  tenantId: number,
  params: {
    buffer: Buffer;
    mimeType: string;
    limit?: number;
  }
): Promise<SearchResponse> {
  const embedding = await embedItemSearchImage(
    params.buffer,
    params.mimeType,
    "query"
  );

  const semanticResult = await searchItemsByEmbeddingProjection(supabase, tenantId, {
    embedding: embedding.embedding,
    limit: params.limit ?? DEFAULT_ITEM_SEARCH_LIMIT,
  });

  const hits = semanticResult.items.map((item) =>
    mapItemProjectionToSearchHit(item, { semanticOnly: true })
  );

  return {
    data: hits,
    totalCount: semanticResult.totalCount,
    meta: {
      mode: "image",
      scope: "global",
      totalCount: semanticResult.totalCount,
      noMatches: hits.length === 0,
    },
  };
}
