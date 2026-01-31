import {
  getPlaces,
  getPlace,
  getPlacesSimple,
  createPlace,
  updatePlace,
} from "@/lib/places/api";

describe("places/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getPlaces вызывает /places", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getPlaces({});

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/places");
  });

  it("getPlace вызывает /places/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { place: { id: 1 } } }),
    });

    const result = await getPlace(1);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/places/1");
    expect(result.data?.place).toEqual({ id: 1 });
  });

  it("getPlacesSimple вызывает /places?showDeleted=...", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await getPlacesSimple(true);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("showDeleted=true");
  });

  it("createPlace вызывает POST /places", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await createPlace({ name: "Shelf", entity_type_id: 1, room_id: 1 });

    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("POST");
  });

  it("updatePlace вызывает PUT /places/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await updatePlace(1, { name: "Updated" });

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/places/1");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("PUT");
  });
});
