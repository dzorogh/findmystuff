import { itemPhotoSearchApiClient } from "@/lib/shared/api/item-photo-search";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

describe("itemPhotoSearchApiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("отправляет файл на /api/items/photo-search и возвращает найденные вещи", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ id: 7, name: "Наушники" }],
          totalCount: 1,
          noSimilarFound: false,
        }),
    });

    const file = new File(["content"], "query.jpg", { type: "image/jpeg" });
    const result = await itemPhotoSearchApiClient.search({
      file,
      entityTypeId: 3,
      hasPhoto: false,
    });

    expect(result).toEqual({
      data: [{ id: 7, name: "Наушники" }],
      totalCount: 1,
      noSimilarFound: false,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/items/photo-search",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });

  it("бросает ошибку, если сервер вернул error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: HTTP_STATUS.BAD_REQUEST,
      json: () => Promise.resolve({ error: "Файл должен быть изображением" }),
    });

    const file = new File(["content"], "query.txt", { type: "text/plain" });

    await expect(
      itemPhotoSearchApiClient.search({ file })
    ).rejects.toThrow("Файл должен быть изображением");
  });
});
