import {
  getSearchIndexJobKey,
  parseSearchIndexJobPayload,
  type SearchIndexJobPayload,
  type SearchIndexQueueMessage,
  type SearchIndexQueueProcessResult,
} from "./search-index-queue";

export interface SearchIndexQueueProcessOptions {
  messages: SearchIndexQueueMessage[];
  syncJob: (payload: SearchIndexJobPayload) => Promise<void>;
  deleteMessages: (messageIds: number[]) => Promise<number | void>;
  onError?: (error: unknown, payload: SearchIndexJobPayload) => void;
}

export function normalizeSearchIndexQueueMessages(
  data: unknown
): SearchIndexQueueMessage[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const candidate = row as Record<string, unknown>;
      const msgId = Number(candidate.msg_id);
      const readCount = Number(candidate.read_ct ?? 0);
      const enqueuedAt = String(candidate.enqueued_at ?? "");
      const visibleAt = String(candidate.vt ?? "");

      if (!Number.isInteger(msgId) || msgId <= 0) {
        return null;
      }

      return {
        msgId,
        readCount: Number.isInteger(readCount) && readCount >= 0 ? readCount : 0,
        enqueuedAt,
        visibleAt,
        message: candidate.message,
      } satisfies SearchIndexQueueMessage;
    })
    .filter((message): message is SearchIndexQueueMessage => message !== null);
}

export async function processSearchIndexQueueBatch({
  messages,
  syncJob,
  deleteMessages,
  onError,
}: SearchIndexQueueProcessOptions): Promise<SearchIndexQueueProcessResult> {
  if (messages.length === 0) {
    return {
      readCount: 0,
      validCount: 0,
      invalidCount: 0,
      duplicateCount: 0,
      attemptedCount: 0,
      processedCount: 0,
      failedCount: 0,
      deletedCount: 0,
      ackedMessageIds: [],
    };
  }

  const groupedMessages = new Map<
    string,
    { payload: SearchIndexJobPayload; messageIds: number[] }
  >();
  const ackedMessageIds: number[] = [];
  let invalidCount = 0;

  for (const message of messages) {
    const payload = parseSearchIndexJobPayload(message.message);
    if (!payload) {
      invalidCount += 1;
      ackedMessageIds.push(message.msgId);
      continue;
    }

    const key = getSearchIndexJobKey(payload);
    const existingGroup = groupedMessages.get(key);

    if (existingGroup) {
      existingGroup.messageIds.push(message.msgId);
      continue;
    }

    groupedMessages.set(key, {
      payload,
      messageIds: [message.msgId],
    });
  }

  let processedCount = 0;
  let failedCount = 0;
  let attemptedCount = 0;

  for (const group of groupedMessages.values()) {
    attemptedCount += 1;

    try {
      await syncJob(group.payload);
      processedCount += 1;
      ackedMessageIds.push(...group.messageIds);
    } catch (error) {
      failedCount += 1;
      onError?.(error, group.payload);
    }
  }

  const deletedCountResult =
    ackedMessageIds.length > 0 ? await deleteMessages(ackedMessageIds) : 0;
  const deletedCount =
    typeof deletedCountResult === "number"
      ? deletedCountResult
      : ackedMessageIds.length;

  const validCount = groupedMessages.size;
  const duplicateCount = Math.max(messages.length - validCount - invalidCount, 0);

  return {
    readCount: messages.length,
    validCount,
    invalidCount,
    duplicateCount,
    attemptedCount,
    processedCount,
    failedCount,
    deletedCount,
    ackedMessageIds,
  };
}
