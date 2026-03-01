import { validateDestinationType, VALID_DESTINATION_TYPES } from "@/lib/shared/api/validate-destination-type";

describe("validateDestinationType", () => {
  it("возвращает null для пустого или отсутствующего значения", () => {
    expect(validateDestinationType(null)).toBeNull();
    expect(validateDestinationType(undefined)).toBeNull();
    expect(validateDestinationType("")).toBeNull();
  });

  it("возвращает приведённый тип для допустимых значений", () => {
    for (const type of VALID_DESTINATION_TYPES) {
      const result = validateDestinationType(type);
      expect(result).toBe(type);
    }
    expect(validateDestinationType("  room  ")).toBe("room");
  });

  it("возвращает NextResponse с 400 для недопустимого значения", async () => {
    const result = validateDestinationType("building");
    expect(result).not.toBeNull();
    expect(typeof result).not.toBe("string");
    const res = result as { status: number; json: () => Promise<{ error: string }> };
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Недопустимый destination_type");
    expect(body.error).toContain("room");
  });

  it("возвращает 400 для произвольной строки", async () => {
    const result = validateDestinationType("invalid");
    expect(result).not.toBeNull();
    expect(typeof result).not.toBe("string");
    const res = result as { status: number };
    expect(res.status).toBe(400);
  });
});
