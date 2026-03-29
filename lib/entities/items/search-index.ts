export interface SearchIndexBackfillCursor {
  entityType: "item" | "container";
  afterId: number;
}

export interface ItemSearchIndexBackfillResponse {
  processed: number;
  nextCursor: SearchIndexBackfillCursor | null;
}

export async function runItemSearchIndexBackfillBatch(params?: {
  cursor?: SearchIndexBackfillCursor | null;
  limit?: number;
}): Promise<ItemSearchIndexBackfillResponse> {
  const response = await fetch("/api/items/search-index/backfill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cursor: params?.cursor ?? null,
      limit: params?.limit ?? 20,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | ItemSearchIndexBackfillResponse
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      data && "error" in data
        ? data.error || "Не удалось переиндексировать эмбединги"
        : "Не удалось переиндексировать эмбединги"
    );
  }

  return {
    processed: typeof data?.processed === "number" ? data.processed : 0,
    nextCursor:
      data?.nextCursor &&
      typeof data.nextCursor === "object" &&
      (data.nextCursor.entityType === "item" || data.nextCursor.entityType === "container") &&
      typeof data.nextCursor.afterId === "number"
        ? data.nextCursor
        : null,
  };
}
