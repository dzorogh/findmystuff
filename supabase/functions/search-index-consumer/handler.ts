import {
  DEFAULT_SEARCH_INDEX_QUEUE_BATCH_SIZE,
  DEFAULT_SEARCH_INDEX_VISIBILITY_TIMEOUT_SECONDS,
  MAX_SEARCH_INDEX_QUEUE_BATCH_SIZE,
  type SearchIndexJobPayload,
  type SearchIndexQueueMessage,
} from "../../../lib/search/search-index-queue.ts";
import { processSearchIndexQueueBatch } from "../../../lib/search/search-index-queue-server.ts";

interface SearchIndexConsumerHandlerDeps {
  authorizeRequest: (request: Request) => Promise<Response | null> | Response | null;
  readMessages: (options: {
    batchSize: number;
    visibilityTimeoutSeconds: number;
  }) => Promise<SearchIndexQueueMessage[]>;
  deleteMessages: (messageIds: number[]) => Promise<number | void>;
  syncJob: (payload: SearchIndexJobPayload) => Promise<void>;
  logError?: (message: string, error?: unknown) => void;
}

interface SearchIndexConsumerBody {
  batchSize?: number;
  visibilityTimeoutSeconds?: number;
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const parseConsumerBody = (value: unknown): SearchIndexConsumerBody => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const candidate = value as Record<string, unknown>;
  const batchSize = Number(candidate.batchSize);
  const visibilityTimeoutSeconds = Number(candidate.visibilityTimeoutSeconds);

  return {
    batchSize: Number.isFinite(batchSize) ? batchSize : undefined,
    visibilityTimeoutSeconds: Number.isFinite(visibilityTimeoutSeconds)
      ? visibilityTimeoutSeconds
      : undefined,
  };
};

const clampBatchSize = (value?: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_SEARCH_INDEX_QUEUE_BATCH_SIZE;
  }

  return Math.min(
    Math.max(Math.trunc(value ?? DEFAULT_SEARCH_INDEX_QUEUE_BATCH_SIZE), 1),
    MAX_SEARCH_INDEX_QUEUE_BATCH_SIZE
  );
};

const clampVisibilityTimeout = (value?: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_SEARCH_INDEX_VISIBILITY_TIMEOUT_SECONDS;
  }

  return Math.max(Math.trunc(value ?? DEFAULT_SEARCH_INDEX_VISIBILITY_TIMEOUT_SECONDS), 1);
};

export const createSearchIndexConsumerHandler =
  (deps: SearchIndexConsumerHandlerDeps) =>
  async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const authResponse = await deps.authorizeRequest(request);
    if (authResponse) {
      return authResponse;
    }

    try {
      const rawBody = await request.json().catch(() => ({}));
      const body = parseConsumerBody(rawBody);
      const batchSize = clampBatchSize(body.batchSize);
      const visibilityTimeoutSeconds = clampVisibilityTimeout(
        body.visibilityTimeoutSeconds
      );

      const messages = await deps.readMessages({
        batchSize,
        visibilityTimeoutSeconds,
      });

      const result = await processSearchIndexQueueBatch({
        messages,
        deleteMessages: deps.deleteMessages,
        syncJob: deps.syncJob,
        onError: (error, payload) => {
          deps.logError?.(
            `Ошибка обработки задачи индексации ${payload.entityType} #${payload.entityId}:`,
            error
          );
        },
      });

      return jsonResponse({
        read: result.readCount,
        valid: result.validCount,
        invalid: result.invalidCount,
        duplicates: result.duplicateCount,
        attempted: result.attemptedCount,
        processed: result.processedCount,
        failed: result.failedCount,
        deleted: result.deletedCount,
      });
    } catch (error) {
      deps.logError?.("Ошибка выполнения consumer-а поисковой очереди:", error);

      return jsonResponse(
        {
          error:
            error instanceof Error
              ? error.message
              : "Не удалось обработать очередь индексации",
        },
        500
      );
    }
  };
