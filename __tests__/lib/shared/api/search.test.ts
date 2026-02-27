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
      json: () => Promise.resolve({ data: [] }),
    });

    await searchApiClient.search("test query");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/search"),
      expect.any(Object)
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      encodeURIComponent("test query")
    );
  });

  it("возвращает данные поиска", async () => {
    const mockResults = [
      { type: "item", id: 1, name: "Item 1" },
      { type: "container", id: 2, name: "Box" },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockResults }),
    });

    const result = await searchApiClient.search("item");

    expect(result.data).toEqual(mockResults);
  });
});
