import type {
  SearchIndexEntityType,
  SearchIndexJobPayload,
} from "./search-index-queue";

export interface SearchIndexJobRunnerDeps {
  syncEntitySearchDocuments: (
    entityType: SearchIndexEntityType,
    entityId: number,
    tenantId: number
  ) => Promise<void>;
  syncItemSearchDocuments: (itemId: number, tenantId: number) => Promise<void>;
}

export const runSearchIndexJob = async (
  payload: SearchIndexJobPayload,
  deps: SearchIndexJobRunnerDeps
): Promise<void> => {
  if (payload.entityType === "item") {
    await deps.syncItemSearchDocuments(payload.entityId, payload.tenantId);
  }

  await deps.syncEntitySearchDocuments(
    payload.entityType,
    payload.entityId,
    payload.tenantId
  );
};
