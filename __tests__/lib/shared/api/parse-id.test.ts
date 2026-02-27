jest.mock("next/server");

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { parseId } from "@/lib/shared/api/parse-id";

describe("parseId", () => {
  it("возвращает NextResponse 400, если id не указан", async () => {
    const result = parseId(undefined);

    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body).toEqual({ error: "Не указан id" });
  });

  it("возвращает NextResponse 400, если id пустая строка", async () => {
    const result = parseId("");

    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body).toEqual({ error: "Не указан id" });
  });

  it("возвращает NextResponse 400, если id невалиден", async () => {
    const result = parseId("abc");

    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body).toEqual({ error: "Неверный ID сущности" });
  });

  it("использует entityLabel в сообщении об ошибке", async () => {
    const result = parseId("-5", { entityLabel: "вещи" });

    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await res.json();
    expect(body).toEqual({ error: "Неверный ID вещи" });
  });

  it("возвращает объект с id при валидном значении", () => {
    const result = parseId("42");

    expect(result).toEqual({ id: 42 });
  });
});

