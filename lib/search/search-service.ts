import type { SupabaseClient } from "@supabase/supabase-js";
import { searchEntitiesByEmbeddingRpc } from "@/lib/entities/api";
import {
  getContainerSearchProjectionByIds,
  getItemSearchProjectionByIds,
  searchContainersByNameProjection,
  searchItemsByNameProjection,
} from "@/lib/entities/items/search-projection-server";
import {
  embedSearchImage,
  embedSearchText,
  isSearchMultimodalConfigured,
} from "@/lib/shared/api/item-multimodal-embeddings-server";
import { logError } from "@/lib/shared/logger";
import {
  mapContainerProjectionToSearchHit,
  mapItemProjectionToSearchHit,
} from "@/lib/search/mappers";
import type {
  ContainerSearchProjection,
  EntitySearchRpcRow,
  ItemSearchProjection,
  SearchHit,
  SearchResponse,
  SearchMatchSource,
} from "@/lib/search/types";

const DEFAULT_GLOBAL_SEARCH_LIMIT = 10;
const DEFAULT_SIMILARITY_THRESHOLD = 0.25;

type IndexedEntityType = "item" | "container";

interface SearchProjectionMatch {
  similarity: number;
  source: SearchMatchSource;
}

type MixedSearchProjection =
  | { entityType: "item"; projection: ItemSearchProjection }
  | { entityType: "container"; projection: ContainerSearchProjection };

function embeddingToVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

function buildProjectionKey(entityType: IndexedEntityType, entityId: number): string {
  return `${entityType}:${entityId}`;
}

function applyMatchToItemProjection(
  item: ItemSearchProjection,
  match: SearchProjectionMatch | null
): ItemSearchProjection {
  return {
    ...item,
    search_match: match,
  };
}

function applyMatchToContainerProjection(
  container: ContainerSearchProjection,
  match: SearchProjectionMatch | null
): ContainerSearchProjection {
  return {
    ...container,
    search_match: match,
  };
}

async function loadSemanticEntityProjections(
  supabase: SupabaseClient,
  tenantId: number,
  embedding: number[],
  limit: number
): Promise<{
  ordered: MixedSearchProjection[];
  totalCount: number;
}> {
  const { data, error } = await searchEntitiesByEmbeddingRpc(supabase, {
    query_embedding_text: embeddingToVectorLiteral(embedding),
    filter_tenant_id: tenantId,
    entity_types: ["item", "container"],
    show_deleted: false,
    page_limit: limit,
    page_offset: 0,
    similarity_threshold: DEFAULT_SIMILARITY_THRESHOLD,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as EntitySearchRpcRow[] | null) ?? [];
  if (rows.length === 0) {
    return {
      ordered: [],
      totalCount: 0,
    };
  }

  const itemIds = rows
    .filter((row) => row.entity_type === "item")
    .map((row) => row.entity_id);
  const containerIds = rows
    .filter((row) => row.entity_type === "container")
    .map((row) => row.entity_id);

  const [items, containers] = await Promise.all([
    getItemSearchProjectionByIds(supabase, tenantId, itemIds),
    getContainerSearchProjectionByIds(supabase, tenantId, containerIds),
  ]);

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const containerMap = new Map(containers.map((container) => [container.id, container]));

  const ordered = rows.flatMap((row) => {
    const match =
      row.similarity != null && row.match_source
        ? {
            similarity: row.similarity,
            source: row.match_source,
          }
        : null;

    if (row.entity_type === "item") {
      const item = itemMap.get(row.entity_id);
      if (!item) {
        return [];
      }

      return [
        {
          entityType: "item" as const,
          projection: applyMatchToItemProjection(item, match),
        },
      ];
    }

    const container = containerMap.get(row.entity_id);
    if (!container) {
      return [];
    }

    return [
      {
        entityType: "container" as const,
        projection: applyMatchToContainerProjection(container, match),
      },
    ];
  });

  return {
    ordered,
    totalCount: rows[0]?.total_count ?? rows.length,
  };
}

function mergeTextSearchProjections(
  semanticResults: MixedSearchProjection[],
  keywordItems: ItemSearchProjection[],
  keywordContainers: ContainerSearchProjection[]
): MixedSearchProjection[] {
  const merged = new Map<string, MixedSearchProjection>();
  const orderedKeys: string[] = [];

  for (const result of semanticResults) {
    const key = buildProjectionKey(result.entityType, result.projection.id);
    merged.set(key, result);
    orderedKeys.push(key);
  }

  for (const item of keywordItems) {
    const key = buildProjectionKey("item", item.id);
    if (!merged.has(key)) {
      orderedKeys.push(key);
    }
    merged.set(
      key,
      merged.get(key) ?? {
        entityType: "item",
        projection: applyMatchToItemProjection(item, {
          similarity: 1,
          source: "keyword",
        }),
      }
    );
  }

  for (const container of keywordContainers) {
    const key = buildProjectionKey("container", container.id);
    if (!merged.has(key)) {
      orderedKeys.push(key);
    }
    merged.set(
      key,
      merged.get(key) ?? {
        entityType: "container",
        projection: applyMatchToContainerProjection(container, {
          similarity: 1,
          source: "keyword",
        }),
      }
    );
  }

  return orderedKeys
    .map((key) => merged.get(key) ?? null)
    .filter((result): result is MixedSearchProjection => result != null);
}

function mapMixedProjectionToHit(result: MixedSearchProjection): SearchHit {
  if (result.entityType === "item") {
    return mapItemProjectionToSearchHit(result.projection, { semanticOnly: true });
  }

  return mapContainerProjectionToSearchHit(result.projection, { semanticOnly: true });
}

export async function searchHomeEntitiesByText(
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

  const limit = options?.limit ?? DEFAULT_GLOBAL_SEARCH_LIMIT;
  const [keywordItems, keywordContainers] = await Promise.all([
    searchItemsByNameProjection(supabase, tenantId, trimmedQuery, { limit }),
    searchContainersByNameProjection(supabase, tenantId, trimmedQuery, { limit }),
  ]);

  if (!isSearchMultimodalConfigured()) {
    const fallbackHits = [
      ...keywordItems.map((item) =>
        mapItemProjectionToSearchHit(
          applyMatchToItemProjection(item, { similarity: 1, source: "keyword" })
        )
      ),
      ...keywordContainers.map((container) =>
        mapContainerProjectionToSearchHit(
          applyMatchToContainerProjection(container, {
            similarity: 1,
            source: "keyword",
          })
        )
      ),
    ];

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

  try {
    const embedding = await embedSearchText(trimmedQuery);
    const semanticResults = await loadSemanticEntityProjections(
      supabase,
      tenantId,
      embedding.embedding,
      limit
    );
    const merged = mergeTextSearchProjections(
      semanticResults.ordered,
      keywordItems,
      keywordContainers
    );
    const hits = merged.map(mapMixedProjectionToHit);

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
    logError("Ошибка semantic search для главной, fallback на keyword:", error);

    const fallbackHits = [
      ...keywordItems.map((item) =>
        mapItemProjectionToSearchHit(
          applyMatchToItemProjection(item, { similarity: 1, source: "keyword" })
        )
      ),
      ...keywordContainers.map((container) =>
        mapContainerProjectionToSearchHit(
          applyMatchToContainerProjection(container, {
            similarity: 1,
            source: "keyword",
          })
        )
      ),
    ];

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

export async function searchHomeEntitiesByImage(
  supabase: SupabaseClient,
  tenantId: number,
  params: {
    buffer: Buffer;
    mimeType: string;
    limit?: number;
  }
): Promise<SearchResponse> {
  const embedding = await embedSearchImage(params.buffer, params.mimeType, "query");
  const semanticResults = await loadSemanticEntityProjections(
    supabase,
    tenantId,
    embedding.embedding,
    params.limit ?? DEFAULT_GLOBAL_SEARCH_LIMIT
  );
  const hits = semanticResults.ordered.map(mapMixedProjectionToHit);

  return {
    data: hits,
    totalCount: semanticResults.totalCount,
    meta: {
      mode: "image",
      scope: "global",
      totalCount: semanticResults.totalCount,
      noMatches: hits.length === 0,
    },
  };
}
