import {
  getBuildings,
  getBuilding,
  getBuildingsSimple,
  createBuilding,
  updateBuilding,
} from "@/lib/buildings/api";

describe("buildings/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getBuildings вызывает /buildings", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getBuildings();

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/buildings");
  });

  it("getBuildings с query добавляет query в URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getBuildings({ query: "test" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("query=test");
  });

  it("getBuildings с showDeleted добавляет showDeleted=true", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getBuildings({ showDeleted: true });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("getBuildings с sortBy и sortDirection добавляет параметры", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getBuildings({ sortBy: "name", sortDirection: "asc" });

    const url = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain("sortBy=name");
    expect(url).toContain("sortDirection=asc");
  });

  it("getBuilding вызывает /buildings/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { building: { id: 1, name: "A" }, rooms: [] },
        }),
    });

    const result = await getBuilding(1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/buildings/1");
    expect(result.data?.building).toEqual({ id: 1, name: "A" });
  });

  it("getBuildingsSimple вызывает /buildings?showDeleted=...", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getBuildingsSimple(true);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("getBuildingsSimple(false) вызывает showDeleted=false", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getBuildingsSimple(false);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=false");
  });

  it("createBuilding вызывает POST /buildings", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await createBuilding({ name: "Здание 1" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/buildings");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });

  it("updateBuilding вызывает PUT /buildings/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await updateBuilding(1, { name: "Updated" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/buildings/1");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("PUT");
  });
});
