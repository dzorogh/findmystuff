import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_CURRENCY_CODES,
  getCurrencyMinorUnits,
  formatAmountDisplay,
  minorUnitsToDisplayString,
  parseMoneyToMinorUnits,
} from "@/lib/shared/money";

describe("money", () => {
  describe("SUPPORTED_CURRENCIES", () => {
    it("содержит RUB, USD, EUR и другие", () => {
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThan(0);
      const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
      expect(codes).toContain("RUB");
      expect(codes).toContain("USD");
      expect(codes).toContain("EUR");
    });
  });

  describe("SUPPORTED_CURRENCY_CODES", () => {
    it("извлекает коды из SUPPORTED_CURRENCIES", () => {
      expect(SUPPORTED_CURRENCY_CODES).toContain("RUB");
      expect(SUPPORTED_CURRENCY_CODES.length).toBe(SUPPORTED_CURRENCIES.length);
    });
  });

  describe("getCurrencyMinorUnits", () => {
    it("возвращает 2 для RUB, USD, EUR", () => {
      expect(getCurrencyMinorUnits("RUB")).toBe(2);
      expect(getCurrencyMinorUnits("USD")).toBe(2);
      expect(getCurrencyMinorUnits("EUR")).toBe(2);
    });

    it("возвращает 0 для JPY", () => {
      expect(getCurrencyMinorUnits("JPY")).toBe(0);
    });

    it("возвращает 2 по умолчанию для неизвестной валюты", () => {
      expect(getCurrencyMinorUnits("XYZ")).toBe(2);
    });
  });

  describe("formatAmountDisplay", () => {
    it("форматирует рубли (10000 копеек = 100,00)", () => {
      expect(formatAmountDisplay(10000, "RUB")).toMatch(/100[.,]00/);
    });

    it("форматирует доллары", () => {
      expect(formatAmountDisplay(12345, "USD")).toMatch(/123[.,]45/);
    });

    it("форматирует йены без дробной части", () => {
      expect(formatAmountDisplay(1000, "JPY")).toMatch(/1\s?000/);
    });
  });

  describe("minorUnitsToDisplayString", () => {
    it("преобразует копейки в строку для ввода", () => {
      expect(minorUnitsToDisplayString(10000, "RUB")).toBe("100.00");
    });

    it("работает с JPY (0 знаков)", () => {
      expect(minorUnitsToDisplayString(1000, "JPY")).toBe("1000");
    });
  });

  describe("parseMoneyToMinorUnits", () => {
    it("парсит валидное число", () => {
      expect(parseMoneyToMinorUnits("100.50", "RUB")).toBe(10050);
      expect(parseMoneyToMinorUnits("100,50", "RUB")).toBe(10050);
    });

    it("возвращает null для пустой строки", () => {
      expect(parseMoneyToMinorUnits("", "RUB")).toBeNull();
      expect(parseMoneyToMinorUnits("   ", "RUB")).toBeNull();
    });

    it("возвращает null для отрицательного числа", () => {
      expect(parseMoneyToMinorUnits("-10", "RUB")).toBeNull();
    });

    it("возвращает null для NaN", () => {
      expect(parseMoneyToMinorUnits("abc", "RUB")).toBeNull();
    });

    it("парсит целое для JPY", () => {
      expect(parseMoneyToMinorUnits("1000", "JPY")).toBe(1000);
    });
  });
});
