import {
  getRooms,
  getRoom,
  getRoomsSimple,
  createRoom,
  updateRoom,
} from "@/lib/rooms/api";

describe("rooms/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getRooms вызывает /rooms", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getRooms();

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/rooms");
  });

  it("getRooms с query добавляет query в URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getRooms({ query: "room" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("query=room");
  });

  it("getRooms с showDeleted добавляет showDeleted=true", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getRooms({ showDeleted: true });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("getRoom вызывает /rooms/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { room: { id: 1 } } }),
    });

    const result = await getRoom(1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/rooms/1");
    expect(result.data?.room).toEqual({ id: 1 });
  });

  it("getRoomsSimple вызывает /rooms?showDeleted=...", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getRoomsSimple(true);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("createRoom вызывает POST /rooms", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await createRoom({ name: "Room 1" });

    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });

  it("updateRoom вызывает PUT /rooms/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await updateRoom(1, { name: "Updated" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/rooms/1");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("PUT");
  });
});
