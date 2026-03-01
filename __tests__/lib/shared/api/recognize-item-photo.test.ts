import { recognizeItemPhotoApiClient } from "@/lib/shared/api/recognize-item-photo";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

describe("RecognizeItemPhotoApiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("отправляет файл на /api/recognize-item-photo и возвращает itemName", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ itemName: "Стул" }),
    });

    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    const result = await recognizeItemPhotoApiClient.recognize(file);

    expect(result).toEqual({ itemName: "Стул" });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/recognize-item-photo",
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
      json: () => Promise.resolve({ itemName: null, error: "Bad image" }),
    });

    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

    await expect(recognizeItemPhotoApiClient.recognize(file)).rejects.toThrow("Bad image");
  });

  it("бросает ошибку, если сервер вернул !ok без error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      json: () => Promise.resolve({ itemName: null }),
    });

    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

    await expect(recognizeItemPhotoApiClient.recognize(file)).rejects.toThrow(
      `HTTP error! status: ${HTTP_STATUS.INTERNAL_SERVER_ERROR}`
    );
  });
});

