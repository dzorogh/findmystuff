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
});
