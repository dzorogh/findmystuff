import { lookupProductName } from "@/lib/shared/api/barcode-lookup-server";

const mockFetch = jest.fn();
const mockCheerio = { load: jest.fn() };

jest.mock("cheerio", () => ({
  load: (...args: unknown[]) => mockCheerio.load(...args),
}));

global.fetch = mockFetch;

describe("barcode-lookup-server", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает null для пустого штрихкода", async () => {
    const result = await lookupProductName("");
    expect(result).toEqual({ productName: null });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("возвращает null для невалидного EAN-13 (не 13 цифр)", async () => {
    const result = await lookupProductName("12345");
    expect(result).toEqual({ productName: null });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("возвращает null для штрихкода с буквами", async () => {
    const result = await lookupProductName("123456789012a");
    expect(result).toEqual({ productName: null });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("возвращает null при ошибке ответа (не ok)", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const result = await lookupProductName("4601234567890");

    expect(result).toEqual({ productName: null });
    expect(mockFetch).toHaveBeenCalled();
  });

  it("возвращает productName из таблицы при успешном парсинге", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body></body></html>"),
    });

    const chain = {
      first: () => ({ text: () => "Товар из списка", trim: () => "Товар из списка" }),
      text: () => "Товар из списка",
      trim: () => "Товар из списка",
    };
    mockCheerio.load.mockReturnValue(() => chain);

    const result = await lookupProductName("4601234567890");

    expect(result).toEqual({ productName: "Товар из списка" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("barcode=4601234567890"),
      expect.any(Object)
    );
  });

  it("возвращает null если ячейка пуста", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html></html>"),
    });

    const chain = {
      first: () => ({ text: () => "", trim: () => "" }),
      text: () => "",
      trim: () => "",
    };
    mockCheerio.load.mockReturnValue(() => chain);

    const result = await lookupProductName("4601234567890");

    expect(result).toEqual({ productName: null });
  });
});
