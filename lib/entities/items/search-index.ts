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
  // eslint-disable-next-line no-restricted-syntax
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

  const successData = data as ItemSearchIndexBackfillResponse | null;

  return {
    processed: typeof successData?.processed === "number" ? successData.processed : 0,
    nextCursor:
      successData?.nextCursor &&
      typeof successData.nextCursor === "object" &&
      (successData.nextCursor.entityType === "item" || successData.nextCursor.entityType === "container") &&
      typeof successData.nextCursor.afterId === "number"
        ? successData.nextCursor
        : null,
  };
}
