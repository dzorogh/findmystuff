import { barcodeLookupApi } from "@/lib/shared/api/barcode-lookup";

describe("barcode-lookup", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("вызывает /barcode-lookup с barcode в query", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ productName: "Товар" }),
    });

    await barcodeLookupApi("4601234567890");

    const url = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain("/api/barcode-lookup");
    expect(url).toContain("barcode=4601234567890");
  });

  it("возвращает productName из ответа", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ productName: "Молоко" }),
    });

    const result = await barcodeLookupApi("4601234567890");

    expect(result.productName).toBe("Молоко");
  });
});
