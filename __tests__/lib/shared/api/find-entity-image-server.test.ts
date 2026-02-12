import { generateEntityImage } from "@/lib/shared/api/find-entity-image-server";

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    images: {
      generate: jest.fn(),
    },
  }));
});

const OpenAI = jest.requireMock("openai") as jest.Mock;

describe("generateEntityImage", () => {
  const mockB64 = Buffer.from("fake-image-data").toString("base64");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает buffer и contentType при успешной генерации", async () => {
    const mockGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: mockB64 }],
    });
    OpenAI.mockImplementation(() => ({
      images: { generate: mockGenerate },
    }));

    const result = await generateEntityImage("api-key", "Стул");

    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("buffer");
    expect(result).toHaveProperty("contentType", "image/png");
    expect((result as { buffer: Buffer }).buffer).toBeInstanceOf(Buffer);
  });

  it("добавляет typeHint в prompt для известного entityType", async () => {
    const mockGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: mockB64 }],
    });
    OpenAI.mockImplementation(() => ({
      images: { generate: mockGenerate },
    }));

    await generateEntityImage("api-key", "Книга", "item");

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("предмет, вещь"),
      })
    );
  });

  it("возвращает error когда OpenAI не возвращает изображение", async () => {
    const mockGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: null }],
    });
    OpenAI.mockImplementation(() => ({
      images: { generate: mockGenerate },
    }));

    const result = await generateEntityImage("api-key", "Стол");

    expect(result).toEqual({ error: "OpenAI не вернул изображение" });
  });

  it("возвращает error при исключении", async () => {
    const mockGenerate = jest
      .fn()
      .mockRejectedValue(new Error("Rate limit exceeded"));
    OpenAI.mockImplementation(() => ({
      images: { generate: mockGenerate },
    }));

    const result = await generateEntityImage("api-key", "Стол");

    expect(result).toEqual({ error: "Rate limit exceeded" });
  });

  it("возвращает error когда изображение слишком большое", async () => {
    const bigB64 = "x".repeat(14 * 1024 * 1024);
    const mockGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: bigB64 }],
    });
    OpenAI.mockImplementation(() => ({
      images: { generate: mockGenerate },
    }));

    const result = await generateEntityImage("api-key", "Стол");

    expect(result).toEqual({ error: "Изображение слишком большое" });
  });

  it("entityType без typeHint использует пустую строку в prompt", async () => {
    const mockGenerate = jest.fn().mockResolvedValue({
      data: [{ b64_json: mockB64 }],
    });
    OpenAI.mockImplementation(() => ({
      images: { generate: mockGenerate },
    }));

    const result = await generateEntityImage("api-key", "Стол", "unknown_type");

    expect(result).toHaveProperty("buffer");
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('"Стол"'),
      })
    );
  });
});
