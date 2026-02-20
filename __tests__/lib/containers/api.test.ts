import {
  getContainers,
  getContainer,
  getContainersSimple,
  createContainer,
  updateContainer,
  getContainersWithLocationRpc,
} from "@/lib/containers/api";

describe("containers/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getContainers вызывает /containers", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getContainers();

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/containers");
  });

  it("getContainers с query добавляет query в URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getContainers({ query: "box" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("query=box");
  });

  it("getContainers с showDeleted добавляет showDeleted=true", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getContainers({ showDeleted: true });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("getContainers с locationType не all добавляет locationType в URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getContainers({ locationType: "room" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("locationType=room");
  });

  it("getContainers с placeId добавляет placeId в URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getContainers({ placeId: 5 });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("placeId=5");
  });

  it("getContainer вызывает /containers/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { container: { id: 1 } } }),
    });

    const result = await getContainer(1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/containers/1");
    expect(result.data?.container).toEqual({ id: 1 });
  });

  it("getContainersSimple вызывает /containers?showDeleted=...", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getContainersSimple(true);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("createContainer вызывает POST /containers", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await createContainer({ name: "Box", entity_type_id: 1 });

    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });

  it("updateContainer вызывает PUT /containers/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await updateContainer(1, { name: "Updated" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/containers/1");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("PUT");
  });

  it("getContainersWithLocationRpc передаёт filter_tenant_id в RPC", () => {
    const rpc = jest.fn().mockReturnValue({});
    const supabase = { rpc } as never;

    getContainersWithLocationRpc(supabase, {
      search_query: "",
      show_deleted: false,
      page_limit: 10,
      page_offset: 0,
      sort_by: "created_at",
      sort_direction: "desc",
      filter_tenant_id: 1,
    });

    expect(rpc).toHaveBeenCalledWith(
      "get_containers_with_location",
      expect.objectContaining({ filter_tenant_id: 1 })
    );
  });

  it("getContainersWithLocationRpc передаёт filter_tenant_id null при отсутствии", () => {
    const rpc = jest.fn().mockReturnValue({});
    const supabase = { rpc } as never;

    getContainersWithLocationRpc(supabase, {
      search_query: "",
      show_deleted: false,
      page_limit: 10,
      page_offset: 0,
      sort_by: "created_at",
      sort_direction: "desc",
    });

    expect(rpc).toHaveBeenCalledWith(
      "get_containers_with_location",
      expect.objectContaining({ filter_tenant_id: null })
    );
  });
});
