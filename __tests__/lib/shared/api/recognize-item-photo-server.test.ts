import { recognizeItemFromPhoto } from "@/lib/shared/api/recognize-item-photo-server";

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    responses: {
      create: jest.fn(),
    },
  }));
});

const OpenAI = jest.requireMock("openai") as jest.Mock;

describe("recognizeItemFromPhoto", () => {
  const buffer = Buffer.from("fake-bytes");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает itemName из output_text", async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      output_text: "  Стул  ",
    });
    OpenAI.mockImplementation(() => ({
      responses: { create: mockCreate },
    }));

    const result = await recognizeItemFromPhoto(
      "api-key",
      buffer,
      "image/png"
    );

    expect(result).toEqual({ itemName: "Стул" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5-mini",
      })
    );
  });

  it("возвращает itemName = null и error при исключении", async () => {
    const mockCreate = jest
      .fn()
      .mockRejectedValue(new Error("OpenAI error"));
    OpenAI.mockImplementation(() => ({
      responses: { create: mockCreate },
    }));

    const result = await recognizeItemFromPhoto(
      "api-key",
      buffer,
      "image/jpeg"
    );

    expect(result).toEqual({
      itemName: null,
      error: "OpenAI error",
    });
  });
});

