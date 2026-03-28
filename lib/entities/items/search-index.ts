export interface ItemSearchIndexBackfillResponse {
  processed: number;
  nextAfterId: number | null;
}

export async function runItemSearchIndexBackfillBatch(params?: {
  afterId?: number;
  limit?: number;
}): Promise<ItemSearchIndexBackfillResponse> {
  const response = await fetch("/api/items/search-index/backfill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      afterId: params?.afterId ?? 0,
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
    nextAfterId:
      typeof data?.nextAfterId === "number" ? data.nextAfterId : null,
  };
}
