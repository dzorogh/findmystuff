import { fetchWithTimeout } from "@/lib/shared/api/fetch-with-timeout";

describe("fetchWithTimeout", () => {
  const originalFetch = global.fetch;
  const originalAbortController = global.AbortController;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => Promise<Response>;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.AbortController = originalAbortController;
    jest.clearAllMocks();
  });

  it("создаёт AbortController и передаёт signal в fetch", async () => {
    const abortSpy = jest.fn();
    const constructedSignals: unknown[] = [];

    class MockAbortController {
      signal: unknown;
      abort: () => void;

      constructor() {
        this.signal = {};
        this.abort = abortSpy;
        constructedSignals.push(this.signal);
      }
    }

    // @ts-expect-error: переопределяем глобальный AbortController только для теста
    global.AbortController = MockAbortController;

    await fetchWithTimeout(1000, "/api/test");

    expect(global.fetch).toHaveBeenCalledWith("/api/test", {
      signal: constructedSignals[0],
    });
    // Аборт по таймеру мы здесь не проверяем, важно лишь, что контроллер создаётся.
  });

  it("подписывается на abort исходного сигнала и вызывает abort контроллера", async () => {
    const abortSpy = jest.fn();

    class MockAbortController {
      signal: unknown;
      abort: () => void;

      constructor() {
        this.signal = {};
        this.abort = abortSpy;
      }
    }

    // @ts-expect-error: переопределяем глобальный AbortController только для теста
    global.AbortController = MockAbortController;

    const externalSignal = {
      addEventListener: (_event: string, handler: () => void) => {
        // Сразу вызываем обработчик, имитируя abort исходного сигнала.
        handler();
      },
    } as unknown as AbortSignal;

    await fetchWithTimeout(1000, "/api/test", { signal: externalSignal });

    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});

