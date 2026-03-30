import type { SearchIndexJobPayload } from "../../search/search-index-queue";

interface RpcErrorLike {
  message: string;
}

interface RpcResponseLike {
  data: unknown;
  error: RpcErrorLike | null;
}

export interface SearchIndexQueueRpcClient {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<RpcResponseLike>;
}

export async function enqueueSearchIndexJob(
  supabase: SearchIndexQueueRpcClient,
  payload: SearchIndexJobPayload
): Promise<number | null> {
  const { data, error } = await supabase.rpc("enqueue_search_index_job", {
    filter_tenant_id: payload.tenantId,
    entity_type: payload.entityType,
    entity_id: payload.entityId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data == null) {
    return null;
  }

  const messageId = Number(data);
  return Number.isInteger(messageId) ? messageId : null;
}

export async function deleteSearchIndexQueueMessages(
  supabase: SearchIndexQueueRpcClient,
  messageIds: number[]
): Promise<number> {
  if (messageIds.length === 0) {
    return 0;
  }

  const { data, error } = await supabase.rpc("delete_search_index_jobs", {
    message_ids: messageIds,
  });

  if (error) {
    throw new Error(error.message);
  }

  const deletedCount = Number(data);
  return Number.isInteger(deletedCount) && deletedCount >= 0
    ? deletedCount
    : messageIds.length;
}
