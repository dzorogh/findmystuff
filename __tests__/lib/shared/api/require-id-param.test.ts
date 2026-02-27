import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { requireIdParam } from "@/lib/shared/api/require-id-param";

describe("requireIdParam", () => {
  it("возвращает NextResponse 400 при пустом id (sync params)", async () => {
    const result = await requireIdParam({ id: "" }, { entityLabel: "вещи" });

    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body).toEqual({ error: "Не указан id" });
  });

  it("возвращает NextResponse 400 при невалидном id", async () => {
    const result = await requireIdParam({ id: "abc" }, { entityLabel: "места" });

    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body).toEqual({ error: "Неверный ID места" });
  });

  it("возвращает { id } при валидном id (sync params)", async () => {
    const result = await requireIdParam({ id: "42" }, { entityLabel: "вещи" });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ id: 42 });
  });

  it("возвращает { id } при валидном id (Promise params)", async () => {
    const result = await requireIdParam(Promise.resolve({ id: "10" }), { entityLabel: "контейнера" });

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ id: 10 });
  });
});
