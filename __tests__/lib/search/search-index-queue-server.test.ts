import {
  normalizeSearchIndexQueueMessages,
  processSearchIndexQueueBatch,
} from "@/lib/search/search-index-queue-server";
import {
  deleteSearchIndexQueueMessages,
  enqueueSearchIndexJob,
  type SearchIndexQueueRpcClient,
} from "@/lib/shared/api/search-index-queue";

describe("search-index-queue-server", () => {
  it("enqueueSearchIndexJob вызывает RPC с корректным payload", async () => {
    const rpc = jest.fn().mockResolvedValue({ data: 42, error: null });
    const client = { rpc } satisfies SearchIndexQueueRpcClient;

    const result = await enqueueSearchIndexJob(client, {
      tenantId: 7,
      entityType: "item",
      entityId: 11,
    });

    expect(result).toBe(42);
    expect(rpc).toHaveBeenCalledWith("enqueue_search_index_job", {
      filter_tenant_id: 7,
      entity_type: "item",
      entity_id: 11,
    });
  });

  it("normalizeSearchIndexQueueMessages отбрасывает невалидные строки", () => {
    const result = normalizeSearchIndexQueueMessages([
      {
        msg_id: 1,
        read_ct: 0,
        enqueued_at: "2026-03-29T20:00:00Z",
        vt: "2026-03-29T20:05:00Z",
        message: { tenantId: 1, entityType: "item", entityId: 2 },
      },
      {
        msg_id: "bad",
      },
      null,
    ]);

    expect(result).toEqual([
      {
        msgId: 1,
        readCount: 0,
        enqueuedAt: "2026-03-29T20:00:00Z",
        visibleAt: "2026-03-29T20:05:00Z",
        message: { tenantId: 1, entityType: "item", entityId: 2 },
      },
    ]);
  });

  it("processSearchIndexQueueBatch делает early return на пустом batch", async () => {
    const result = await processSearchIndexQueueBatch({
      messages: [],
      syncJob: jest.fn(),
      deleteMessages: jest.fn(),
    });

    expect(result).toEqual({
      readCount: 0,
      validCount: 0,
      invalidCount: 0,
      duplicateCount: 0,
      attemptedCount: 0,
      processedCount: 0,
      failedCount: 0,
      deletedCount: 0,
      ackedMessageIds: [],
    });
  });

  it("processSearchIndexQueueBatch дедуплицирует задачи и ack-ает все дубликаты после успеха", async () => {
    const syncJob = jest.fn().mockResolvedValue(undefined);
    const deleteMessages = jest.fn().mockResolvedValue(3);

    const result = await processSearchIndexQueueBatch({
      messages: [
        {
          msgId: 1,
          readCount: 0,
          enqueuedAt: "a",
          visibleAt: "b",
          message: { tenantId: 1, entityType: "item", entityId: 2 },
        },
        {
          msgId: 2,
          readCount: 0,
          enqueuedAt: "a",
          visibleAt: "b",
          message: { tenantId: 1, entityType: "item", entityId: 2 },
        },
        {
          msgId: 3,
          readCount: 0,
          enqueuedAt: "a",
          visibleAt: "b",
          message: { tenantId: 1, entityType: "container", entityId: 5 },
        },
      ],
      syncJob,
      deleteMessages,
    });

    expect(syncJob).toHaveBeenCalledTimes(2);
    expect(syncJob).toHaveBeenNthCalledWith(1, {
      tenantId: 1,
      entityType: "item",
      entityId: 2,
    });
    expect(syncJob).toHaveBeenNthCalledWith(2, {
      tenantId: 1,
      entityType: "container",
      entityId: 5,
    });
    expect(deleteMessages).toHaveBeenCalledWith([1, 2, 3]);
    expect(result.duplicateCount).toBe(1);
    expect(result.processedCount).toBe(2);
    expect(result.deletedCount).toBe(3);
  });

  it("processSearchIndexQueueBatch удаляет невалидные сообщения и оставляет неуспешные на retry", async () => {
    const syncJob = jest
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);
    const deleteMessages = jest.fn().mockResolvedValue(2);
    const onError = jest.fn();

    const result = await processSearchIndexQueueBatch({
      messages: [
        {
          msgId: 1,
          readCount: 0,
          enqueuedAt: "a",
          visibleAt: "b",
          message: { tenantId: 1, entityType: "item", entityId: 2 },
        },
        {
          msgId: 2,
          readCount: 0,
          enqueuedAt: "a",
          visibleAt: "b",
          message: { tenantId: 1, entityType: "container", entityId: 5 },
        },
        {
          msgId: 3,
          readCount: 0,
          enqueuedAt: "a",
          visibleAt: "b",
          message: { tenantId: 1, entityType: "invalid", entityId: 5 },
        },
      ],
      syncJob,
      deleteMessages,
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(deleteMessages).toHaveBeenCalledWith([3, 2]);
    expect(result.invalidCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.processedCount).toBe(1);
    expect(result.deletedCount).toBe(2);
  });

  it("deleteSearchIndexQueueMessages не вызывает RPC для пустого списка", async () => {
    const rpc = jest.fn();
    const client = { rpc } satisfies SearchIndexQueueRpcClient;

    const result = await deleteSearchIndexQueueMessages(client, []);

    expect(result).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });
});
