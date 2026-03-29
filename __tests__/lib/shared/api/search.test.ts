import { searchApiClient } from "@/lib/shared/api/search";

describe("searchApiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("вызывает request с закодированным query", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [],
          totalCount: 0,
          meta: { mode: "text", scope: "global", totalCount: 0, noMatches: true },
        }),
    });

    await searchApiClient.searchText("test query");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/search"),
      expect.any(Object)
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      encodeURIComponent("test query")
    );
  });

  it("прокидывает AbortSignal в текстовый поиск", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [],
          totalCount: 0,
          meta: { mode: "text", scope: "global", totalCount: 0, noMatches: true },
        }),
    });

    const controller = new AbortController();
    await searchApiClient.searchText("abort me", { signal: controller.signal });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/search"),
      expect.objectContaining({
        signal: controller.signal,
      })
    );
  });

  it("возвращает данные поиска", async () => {
    const mockResults = [
      {
        entityType: "item",
        entityId: 1,
        title: "Item 1",
        href: "/items/1",
        badges: [],
        locationLines: [],
      },
      {
        entityType: "container",
        entityId: 2,
        title: "Box",
        href: "/containers/2",
        badges: [],
        locationLines: [],
      },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockResults,
          totalCount: 2,
          meta: { mode: "text", scope: "global", totalCount: 2, noMatches: false },
        }),
    });

    const result = await searchApiClient.searchText("item");

    expect(result.data).toEqual(mockResults);
    expect(result.totalCount).toBe(2);
  });

  it("отправляет фото на единый /api/search", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [],
          totalCount: 0,
          meta: { mode: "image", scope: "global", totalCount: 0, noMatches: true },
        }),
    });

    const file = new File(["content"], "query.jpg", { type: "image/jpeg" });
    await searchApiClient.searchByPhoto(file);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/search",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });
});
