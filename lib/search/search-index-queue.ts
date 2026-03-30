export const SEARCH_INDEX_QUEUE_NAME = "search_index_jobs";
export const SEARCH_INDEX_CONSUMER_FUNCTION_NAME = "search-index-consumer";

export const DEFAULT_SEARCH_INDEX_QUEUE_BATCH_SIZE = 20;
export const DEFAULT_SEARCH_INDEX_VISIBILITY_TIMEOUT_SECONDS = 300;
export const MAX_SEARCH_INDEX_QUEUE_BATCH_SIZE = 100;

export type SearchIndexEntityType = "item" | "container";

export interface SearchIndexJobPayload {
  tenantId: number;
  entityType: SearchIndexEntityType;
  entityId: number;
}

export interface SearchIndexQueueMessage {
  msgId: number;
  readCount: number;
  enqueuedAt: string;
  visibleAt: string;
  message: unknown;
}

export interface SearchIndexNormalizedQueueMessage extends SearchIndexQueueMessage {
  payload: SearchIndexJobPayload;
}

export interface SearchIndexQueueProcessResult {
  readCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  attemptedCount: number;
  processedCount: number;
  failedCount: number;
  deletedCount: number;
  ackedMessageIds: number[];
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const isSearchIndexEntityType = (
  value: unknown
): value is SearchIndexEntityType => value === "item" || value === "container";

export const isSearchIndexJobPayload = (
  value: unknown
): value is SearchIndexJobPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isPositiveInteger(candidate.tenantId) &&
    isPositiveInteger(candidate.entityId) &&
    isSearchIndexEntityType(candidate.entityType)
  );
};

export const parseSearchIndexJobPayload = (
  value: unknown
): SearchIndexJobPayload | null => {
  if (!isSearchIndexJobPayload(value)) {
    return null;
  }

  return value;
};

export const getSearchIndexJobKey = (payload: SearchIndexJobPayload): string =>
  `${payload.tenantId}:${payload.entityType}:${payload.entityId}`;
