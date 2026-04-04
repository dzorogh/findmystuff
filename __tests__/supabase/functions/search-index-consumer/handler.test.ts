import { createSearchIndexConsumerHandler } from "@/supabase/functions/search-index-consumer/handler";

class MockHeaders {
  private readonly values = new Map<string, string>();

  constructor(init?: HeadersInit) {
    if (!init) {
      return;
    }

    for (const [key, value] of Object.entries(init as Record<string, string>)) {
      this.values.set(key.toLowerCase(), value);
    }
  }

  get(name: string): string | null {
    return this.values.get(name.toLowerCase()) ?? null;
  }
}

class MockResponse {
  readonly status: number;
  readonly headers: MockHeaders;

  constructor(
    private readonly body: string,
    init?: { status?: number; headers?: HeadersInit }
  ) {
    this.status = init?.status ?? 200;
    this.headers = new MockHeaders(init?.headers);
  }

  async json(): Promise<unknown> {
    return this.body ? JSON.parse(this.body) : null;
  }
}

Object.assign(globalThis, {
  Response: MockResponse,
});

const createRequest = (init?: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}) =>
  ({
    method: init?.method ?? "POST",
    headers: new MockHeaders({
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    }),
    json: async () => {
      if (init?.body === undefined) return {};
      if (typeof init.body === "string") return JSON.parse(init.body);
      return init.body;
    },
  } as unknown as Request);

describe("search-index-consumer handler", () => {
  it("возвращает 405 для неподдерживаемого метода", async () => {
    const handler = createSearchIndexConsumerHandler({
      authorizeRequest: jest.fn(),
      readMessages: jest.fn(),
      deleteMessages: jest.fn(),
      syncJob: jest.fn(),
    });

    const response = await handler(createRequest({ method: "GET" }));

    expect(response.status).toBe(405);
  });

  it("возвращает ответ авторизации, если запрос не авторизован", async () => {
    const authorizeRequest = jest
      .fn()
      .mockResolvedValue(
        new MockResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
      );
    const handler = createSearchIndexConsumerHandler({
      authorizeRequest,
      readMessages: jest.fn(),
      deleteMessages: jest.fn(),
      syncJob: jest.fn(),
    });

    const response = await handler(createRequest());

    expect(response.status).toBe(401);
    expect(authorizeRequest).toHaveBeenCalledTimes(1);
  });

  it("обрабатывает batch и возвращает counters", async () => {
    const readMessages = jest.fn().mockResolvedValue([
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
        message: { tenantId: 1, entityType: "container", entityId: 8 },
      },
    ]);
    const deleteMessages = jest.fn().mockResolvedValue(3);
    const syncJob = jest.fn().mockResolvedValue(undefined);
    const handler = createSearchIndexConsumerHandler({
      authorizeRequest: jest.fn().mockResolvedValue(null),
      readMessages,
      deleteMessages,
      syncJob,
      logError: jest.fn(),
    });

    const response = await handler(
      createRequest({
        body: { batchSize: 50, visibilityTimeoutSeconds: 120 },
      })
    );

    expect(response.status).toBe(200);
    expect(readMessages).toHaveBeenCalledWith({
      batchSize: 50,
      visibilityTimeoutSeconds: 120,
    });

    const body = await response.json();
    expect(body).toEqual({
      read: 3,
      valid: 2,
      invalid: 0,
      duplicates: 1,
      attempted: 2,
      processed: 2,
      failed: 0,
      deleted: 3,
    });
  });

  it("возвращает 500 и логирует ошибку consumer-а", async () => {
    const logError = jest.fn();
    const handler = createSearchIndexConsumerHandler({
      authorizeRequest: jest.fn().mockResolvedValue(null),
      readMessages: jest.fn().mockRejectedValue(new Error("queue down")),
      deleteMessages: jest.fn(),
      syncJob: jest.fn(),
      logError,
    });

    const response = await handler(createRequest());

    expect(response.status).toBe(500);
    expect(logError).toHaveBeenCalled();

    const body = await response.json();
    expect(body.error).toBe("queue down");
  });
});
