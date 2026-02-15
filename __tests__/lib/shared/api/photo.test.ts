import { photoApi } from "@/lib/shared/api/photo";

describe("photoApi", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("возвращает url при успешной загрузке", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://example.com/photo.jpg" }),
    });

    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    const result = await photoApi.uploadPhoto(file);

    expect(result.data?.url).toBe("https://example.com/photo.jpg");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/upload-photo",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });

  it("выбрасывает ошибку при !response.ok с json error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () => Promise.resolve({ error: "Invalid file type" }),
    });

    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    await expect(photoApi.uploadPhoto(file)).rejects.toThrow("Invalid file type");
  });

  it("выбрасывает ошибку при !response.ok без json", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    await expect(photoApi.uploadPhoto(file)).rejects.toThrow("Ошибка сервера");
  });

  it("выбрасывает ошибку если сервер не вернул url", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    await expect(photoApi.uploadPhoto(file)).rejects.toThrow(
      "Сервер не вернул URL загруженного файла"
    );
  });
});

describe("photoApi.findEntityImage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("возвращает url при успешном поиске", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://example.com/icon.png" }),
    });

    const result = await photoApi.findEntityImage({ name: "Стол" });

    expect(result.data?.url).toBe("https://example.com/icon.png");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("find-entity-image"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Стол", entityType: undefined }),
      })
    );
  });

  it("передаёт entityType в body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://x.com/i.png" }),
    });

    await photoApi.findEntityImage({ name: "Шкаф", entityType: "furniture" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ name: "Шкаф", entityType: "furniture" }),
      })
    );
  });

  it("выбрасывает ошибку при !response.ok с json error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    });

    await expect(
      photoApi.findEntityImage({ name: "X" })
    ).rejects.toThrow("Not found");
  });

  it("выбрасывает ошибку если сервер не вернул url", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await expect(photoApi.findEntityImage({ name: "X" })).rejects.toThrow(
      "Сервер не вернул URL изображения"
    );
  });
});
