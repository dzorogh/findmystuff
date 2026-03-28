import { recognizeItemFromPhoto } from "@/lib/shared/api/recognize-item-photo-server";

if (typeof global.structuredClone !== "function") {
  global.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    responses: {
      parse: jest.fn(),
    },
  }));
});

const OpenAI = jest.requireMock("openai") as jest.Mock;

describe("recognizeItemFromPhoto", () => {
  const buffer = Buffer.from("fake-bytes");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает itemName и itemTypeId из structured output", async () => {
    const mockParse = jest.fn().mockResolvedValue({
      output_parsed: {
        itemName: "  Стул  ",
        itemTypeId: 2,
      },
    });
    OpenAI.mockImplementation(() => ({
      responses: { parse: mockParse },
    }));

    const result = await recognizeItemFromPhoto(
      "api-key",
      buffer,
      "image/png",
      [
        { id: 1, name: "Стол" },
        { id: 2, name: "Стул" },
      ]
    );

    expect(result).toEqual({ itemName: "Стул", itemTypeId: 2 });
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5-mini",
      })
    );
  });

  it("сбрасывает itemTypeId в null, если модель вернула id вне разрешенного списка", async () => {
    const mockParse = jest.fn().mockResolvedValue({
      output_parsed: {
        itemName: "Наушники",
        itemTypeId: 999,
      },
    });
    OpenAI.mockImplementation(() => ({
      responses: { parse: mockParse },
    }));

    const result = await recognizeItemFromPhoto(
      "api-key",
      buffer,
      "image/jpeg",
      [{ id: 4, name: "Электроника" }]
    );

    expect(result).toEqual({
      itemName: "Наушники",
      itemTypeId: null,
    });
  });

  it("возвращает itemName = null, itemTypeId = null и error при исключении", async () => {
    const mockParse = jest
      .fn()
      .mockRejectedValue(new Error("OpenAI error"));
    OpenAI.mockImplementation(() => ({
      responses: { parse: mockParse },
    }));

    const result = await recognizeItemFromPhoto(
      "api-key",
      buffer,
      "image/jpeg"
    );

    expect(result).toEqual({
      itemName: null,
      itemTypeId: null,
      error: "OpenAI error",
    });
  });
});

