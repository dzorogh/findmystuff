import { createSimpleListCache } from "@/lib/shared/cache/simple-list-cache";

describe("createSimpleListCache", () => {
  it("get возвращает undefined для неизвестного ключа", () => {
    const cache = createSimpleListCache<{ id: number }>();
    expect(cache.get("x")).toBeUndefined();
  });

  it("load и get сохраняют и возвращают данные", async () => {
    const cache = createSimpleListCache<{ id: number }>();
    await cache.load("key", () => Promise.resolve({ data: [{ id: 1 }] }));
    expect(cache.get("key")?.data).toEqual([{ id: 1 }]);
    expect(cache.get("key")?.error).toBeNull();
  });

  it("subscribe вызывает notify при load", async () => {
    const cache = createSimpleListCache<number>();
    const notify = jest.fn();
    cache.subscribe("k", notify);
    await cache.load("k", () => Promise.resolve({ data: [1, 2] }));
    expect(notify).toHaveBeenCalledWith([1, 2], null);
  });

  it("invalidate очищает кэш по ключу", async () => {
    const cache = createSimpleListCache<number>();
    await cache.load("k", () => Promise.resolve({ data: [1] }));
    cache.invalidate("k");
    expect(cache.get("k")).toBeUndefined();
  });

  it("load с reject: get возвращает entry с error и пустыми data", async () => {
    const cache = createSimpleListCache<number>();
    const err = new Error("load failed");
    await cache.load("k", () => Promise.reject(err));
    const entry = cache.get("k");
    expect(entry).toBeDefined();
    expect(entry?.error).toBe(err);
    expect(entry?.data).toEqual([]);
  });

  it("in-flight результат игнорируется после invalidate (keyVersions)", async () => {
    const cache = createSimpleListCache<number>();
    let resolveLoader!: (v: { data: number[] }) => void;
    const loaderPromise = new Promise<{ data: number[] }>((r) => {
      resolveLoader = r;
    });
    const loadPromise = cache.load("k", () => loaderPromise);
    cache.invalidate("k");
    resolveLoader({ data: [1] });
    await loadPromise;
    expect(cache.get("k")).toBeUndefined();
  });

  it("unsubscribe: отписанный callback не вызывается при load", async () => {
    const cache = createSimpleListCache<number>();
    const fn = jest.fn();
    const unsubscribe = cache.subscribe("k", fn);
    unsubscribe();
    await cache.load("k", () => Promise.resolve({ data: [1] }));
    expect(fn).not.toHaveBeenCalled();
  });
});
