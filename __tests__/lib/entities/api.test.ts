import {
  getItems,
  getItem,
  getItemTransitions,
  createItem,
  updateItem,
  getEntityTypes,
  createEntityType,
  updateEntityType,
  deleteEntityType,
  createTransition,
} from "@/lib/entities/api";

describe("entities/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getItems вызывает /items", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getItems();

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/items");
  });

  it("getItems с params добавляет query string", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getItems({
      query: "box",
      showDeleted: true,
      page: 1,
      limit: 10,
      locationType: "room",
      roomId: 2,
      hasPhoto: true,
    });

    const url = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain("query=box");
    expect(url).toContain("showDeleted=true");
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
    expect(url).toContain("locationType=room");
    expect(url).toContain("roomId=2");
    expect(url).toContain("hasPhoto=true");
  });

  it("getItems с hasPhoto false добавляет hasPhoto=false", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getItems({ hasPhoto: false });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("hasPhoto=false");
  });

  it("getItem вызывает /items/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    const result = await getItem(1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/items/1");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).not.toContain("includeTransitions");
    expect(result.data).toEqual({ id: 1 });
  });

  it("getItemTransitions вызывает /items/:id/transitions", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getItemTransitions(1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/items/1/transitions");
  });

  it("createItem вызывает POST /items", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await createItem({ name: "Item" });

    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });

  it("updateItem вызывает PUT /items/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await updateItem(1, { name: "Updated" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/items/1");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("PUT");
  });

  it("getEntityTypes вызывает /entity-types", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getEntityTypes("container");

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/entity-types");
  });

  it("createEntityType вызывает POST /entity-types", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await createEntityType({ entity_category: "container", name: "Box" });

    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });

  it("updateEntityType вызывает PUT /entity-types", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await updateEntityType({ id: 1, name: "Updated" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/entity-types");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("PUT");
  });

  it("deleteEntityType вызывает DELETE /entity-types?id=...", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { success: true } }),
    });

    await deleteEntityType(1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/entity-types");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("id=1");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("DELETE");
  });

  it("createTransition вызывает POST /transitions", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await createTransition({
      item_id: 1,
      destination_type: "container",
      destination_id: 2,
    });

    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });
});
