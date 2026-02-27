/**
 * Юнит-тесты для app/api/entities/[table]/[id]/duplicate/route.ts (POST).
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

jest.mock("@/lib/shared/api/require-auth", () => ({
  requireAuthAndTenant: jest.fn(),
}));

jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn(),
}));

const requireAuthAndTenant = jest.requireMock("@/lib/shared/api/require-auth")
  .requireAuthAndTenant as jest.Mock;
const createClient = jest.requireMock("@/lib/shared/supabase/server").createClient as jest.Mock;

const createRequest = () => ({
  url: "http://localhost/api/entities/places/1/duplicate",
  method: "POST",
  headers: new Headers({ "Content-Type": "application/json" }),
  json: async () => ({}),
} as unknown as Request);

describe("POST /api/entities/[table]/[id]/duplicate", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { POST } = await import("@/app/api/entities/[table]/[id]/duplicate/route");
    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ table: "places", id: "1" }),
    });
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 400 при недопустимой таблице", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    const { POST } = await import("@/app/api/entities/[table]/[id]/duplicate/route");
    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ table: "invalid_table", id: "1" }),
    });
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const data = await response.json();
    expect(data.error).toContain("таблиц");
  });

  it("возвращает 400 при неверном id", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    const { POST } = await import("@/app/api/entities/[table]/[id]/duplicate/route");
    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ table: "places", id: "0" }),
    });
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("возвращает 404, если сущность не найдена", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    createClient.mockResolvedValue({ from: jest.fn(() => selectChain) });
    const { POST } = await import("@/app/api/entities/[table]/[id]/duplicate/route");
    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ table: "places", id: "999" }),
    });
    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    const data = await response.json();
    expect(data.error).toContain("не найдена");
  });

  it("возвращает 201 и данные копии при успешном дублировании", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    const sourceRow = {
      id: 1,
      name: "Место",
      photo_url: null,
      entity_type_id: 1,
      deleted_at: null,
    };
    const duplicatedRow = {
      id: 2,
      name: "Место (копия)",
      photo_url: null,
      entity_type_id: 1,
      tenant_id: 1,
    };
    let placesFromCalls = 0;
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: sourceRow, error: null }),
    };
    const insertChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: duplicatedRow, error: null }),
    };
    const transitionsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    createClient.mockResolvedValue({
      from: jest.fn((table: string) => {
        if (table === "transitions") return transitionsChain;
        if (table === "places") {
          placesFromCalls++;
          return placesFromCalls === 1 ? selectChain : insertChain;
        }
        return selectChain;
      }),
    });
    const { POST } = await import("@/app/api/entities/[table]/[id]/duplicate/route");
    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ table: "places", id: "1" }),
    });
    expect(response.status).toBe(HTTP_STATUS.CREATED);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.id).toBe(2);
    expect(data.data.name).toBe("Место (копия)");
  });
});
