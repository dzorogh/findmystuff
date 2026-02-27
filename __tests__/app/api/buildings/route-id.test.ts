/**
 * Юнит-тесты для app/api/buildings/[id]/route.ts (GET и PUT).
 * Проверяют поведение при неавторизованном запросе, неверном id и успешной загрузке/обновлении.
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

jest.mock("@/lib/shared/api/require-auth", () => ({
  requireAuthAndTenant: jest.fn(),
}));

jest.mock("@/lib/shared/api/parse-id", () => ({
  parseId: jest.fn(),
}));

jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn(),
}));

const requireAuthAndTenant = jest.requireMock("@/lib/shared/api/require-auth")
  .requireAuthAndTenant as jest.Mock;
const parseId = jest.requireMock("@/lib/shared/api/parse-id").parseId as jest.Mock;
const createClient = jest.requireMock("@/lib/shared/supabase/server")
  .createClient as jest.Mock;

const createRequest = (url = "http://localhost/api/buildings/1") => {
  const headers = new Headers();
  return {
    url,
    method: "GET",
    headers,
    json: async () => ({}),
  } as unknown as Request;
};

describe("GET /api/buildings/[id]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    const authRes = NextResponse.json(
      { error: "Не авторизован" },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
    requireAuthAndTenant.mockResolvedValue(authRes);

    const { GET } = await import("@/app/api/buildings/[id]/route");
    const request = createRequest();
    const response = await GET(request, { params: Promise.resolve({ id: "1" }) });

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(parseId).not.toHaveBeenCalled();
  });

  it("возвращает 400 при невалидном id", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    const badRequestRes = NextResponse.json(
      { error: "Некорректный id здания" },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
    parseId.mockReturnValue(badRequestRes);

    const { GET } = await import("@/app/api/buildings/[id]/route");
    const request = createRequest();
    const response = await GET(request, { params: Promise.resolve({ id: "abc" }) });

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 404, если здание не найдено", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue({ id: 999 });
    const buildChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    };
    const roomsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [] }),
    };
    createClient.mockResolvedValue({
      from: jest.fn((table: string) => (table === "buildings" ? buildChain : roomsChain)),
    });

    const { GET } = await import("@/app/api/buildings/[id]/route");
    const request = createRequest();
    const response = await GET(request, { params: Promise.resolve({ id: "999" }) });

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("возвращает 200 и данные при успешной загрузке", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue({ id: 1 });
    const buildingData = {
      id: 1,
      name: "Здание",
      photo_url: null,
      created_at: "2024-01-01",
      deleted_at: null,
      building_type_id: null,
      entity_types: null,
    };
    const buildChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: buildingData, error: null }),
    };
    const roomsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [] }),
    };
    createClient.mockResolvedValue({
      from: jest.fn((table: string) => (table === "buildings" ? buildChain : roomsChain)),
    });

    const { GET } = await import("@/app/api/buildings/[id]/route");
    const request = createRequest();
    const response = await GET(request, { params: Promise.resolve({ id: "1" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.building).toEqual(
      expect.objectContaining({
        id: 1,
        name: "Здание",
        photo_url: null,
        building_type_id: null,
      })
    );
    expect(body.data.rooms).toEqual([]);
  });
});

describe("PUT /api/buildings/[id]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    const authRes = NextResponse.json(
      { error: "Не авторизован" },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
    requireAuthAndTenant.mockResolvedValue(authRes);

    const { PUT } = await import("@/app/api/buildings/[id]/route");
    const request = {
      url: "http://localhost/api/buildings/1",
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ name: "Building" }),
    } as unknown as Request;
    const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("возвращает 500 при ошибке обновления в БД", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue({ id: 1 });
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    };
    createClient.mockResolvedValue({
      from: jest.fn(() => updateChain),
    });

    const { PUT } = await import("@/app/api/buildings/[id]/route");
    const request = {
      url: "http://localhost/api/buildings/1",
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ name: "Updated" }),
    } as unknown as Request;
    const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const body = await response.json();
    expect(body.error).toBe("DB error");
  });

  it("возвращает 200 и данные при успешном обновлении", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue({ id: 1 });
    const updatedBuilding = {
      id: 1,
      name: "Updated Building",
      photo_url: null,
      building_type_id: null,
    };
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: updatedBuilding, error: null }),
    };
    createClient.mockResolvedValue({
      from: jest.fn(() => updateChain),
    });

    const { PUT } = await import("@/app/api/buildings/[id]/route");
    const request = {
      url: "http://localhost/api/buildings/1",
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ name: "Updated Building" }),
    } as unknown as Request;
    const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(updatedBuilding);
  });
});
