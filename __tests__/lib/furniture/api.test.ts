import {
  getFurniture,
  getFurnitureItem,
  getFurnitureSimple,
  createFurniture,
  updateFurniture,
} from "@/lib/furniture/api";

describe("furniture/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getFurniture вызывает /furniture", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getFurniture();

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/furniture");
  });

  it("getFurniture с query добавляет query в URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getFurniture({ query: "table" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("query=table");
  });

  it("getFurniture с roomId добавляет roomId в URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getFurniture({ roomId: 5 });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("roomId=5");
  });

  it("getFurniture с showDeleted добавляет showDeleted=true", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getFurniture({ showDeleted: true });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("getFurnitureItem вызывает /furniture/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { furniture: { id: 1, name: "Стол" }, places: [] },
        }),
    });

    const result = await getFurnitureItem(1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/furniture/1");
    expect(result.data?.furniture).toEqual({ id: 1, name: "Стол" });
  });

  it("getFurnitureSimple вызывает /furniture?showDeleted=...", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getFurnitureSimple(true);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("createFurniture вызывает POST /furniture", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await createFurniture({ name: "Стол", room_id: 1 });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/furniture");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });

  it("updateFurniture вызывает PUT /furniture/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await updateFurniture(1, { name: "Стол обновлённый" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/furniture/1");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("PUT");
  });
});
