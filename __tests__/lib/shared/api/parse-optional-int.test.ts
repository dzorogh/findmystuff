import { parseOptionalInt } from "@/lib/shared/api/parse-optional-int";

describe("parseOptionalInt", () => {
  it("возвращает null для null и undefined", () => {
    expect(parseOptionalInt(null)).toBeNull();
    expect(parseOptionalInt(undefined)).toBeNull();
  });

  it("возвращает null для пустой строки", () => {
    expect(parseOptionalInt("")).toBeNull();
  });

  it("возвращает null для нечислового значения", () => {
    expect(parseOptionalInt("abc")).toBeNull();
  });

  it("парсит положительное целое число", () => {
    expect(parseOptionalInt("10")).toBe(10);
  });
});

