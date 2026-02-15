import { lookupProductName } from "@/lib/shared/api/barcode-lookup-server";

const mockFetch = jest.fn();
const originalEnv = process.env;

global.fetch = mockFetch;

describe("barcode-lookup-server", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, BARCODES_API_KEY: "test-api-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
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

  it("возвращает null если BARCODES_API_KEY не задан", async () => {
    delete process.env.BARCODES_API_KEY;
    const result = await lookupProductName("4601234567890");
    expect(result).toEqual({ productName: null });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("возвращает null при ошибке ответа (не ok)", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const result = await lookupProductName("4601234567890");

    expect(result).toEqual({ productName: null });
    expect(mockFetch).toHaveBeenCalled();
  });

  it("возвращает productName из names[0] при успешном ответе", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 200,
          names: ["ОЧИСТИТЕЛЬ ПЯТЕН CLN 30810 PRO, АНТИСКОТЧ/БИТУМ/КЛЕЙ"],
        }),
    });

    const result = await lookupProductName("4601234567890");

    expect(result).toEqual({
      productName: "ОЧИСТИТЕЛЬ ПЯТЕН CLN 30810 PRO, АНТИСКОТЧ/БИТУМ/КЛЕЙ",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/barcodes\.olegon\.ru\/api\/card\/name\/4601234567890\/test-api-key/)
    );
  });

  it("возвращает null если names пуст или первый элемент пуст", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 200, names: [] }),
    });

    const result = await lookupProductName("4601234567890");

    expect(result).toEqual({ productName: null });
  });
});
