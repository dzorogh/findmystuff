import { softDeleteApiClient } from "@/lib/shared/api/soft-delete";

describe("softDeleteApiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("softDelete вызывает DELETE /entities/:table/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { success: true } }),
    });

    const result = await softDeleteApiClient.softDelete("items", 5);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/entities/items/5",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(result.data).toEqual({ success: true });
  });

  it("restoreDeleted вызывает POST /entities/:table/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { success: true } }),
    });

    const result = await softDeleteApiClient.restoreDeleted("containers", 3);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/entities/containers/3",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.data).toEqual({ success: true });
  });

  it("возвращает error при неуспешном ответе", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: "Forbidden" }),
    });

    const result = await softDeleteApiClient.softDelete("rooms", 1);

    expect(result.error).toBe("Forbidden");
  });
});
