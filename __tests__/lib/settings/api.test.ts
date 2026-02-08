import { getSettings, updateSetting } from "@/lib/settings/api";

describe("settings/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getSettings вызывает /settings и возвращает data", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ id: 1, key: "theme", value: "dark", category: "ui" }],
        }),
    });

    const result = await getSettings();

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("updateSetting вызывает PUT /settings", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    await updateSetting("theme", "light");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({ method: "PUT" })
    );
  });
});
