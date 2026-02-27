/**
 * Юнит-тесты для app/api/containers/[id]/route.ts (GET и PUT).
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

jest.mock("@/lib/containers/load-container-detail", () => ({
  loadContainerDetail: jest.fn(),
}));

const requireAuthAndTenant = jest.requireMock("@/lib/shared/api/require-auth")
  .requireAuthAndTenant as jest.Mock;
const parseId = jest.requireMock("@/lib/shared/api/parse-id").parseId as jest.Mock;
const createClient = jest.requireMock("@/lib/shared/supabase/server")
  .createClient as jest.Mock;
const loadContainerDetail = jest.requireMock("@/lib/containers/load-container-detail")
  .loadContainerDetail as jest.Mock;

const createRequest = (url = "http://localhost/api/containers/1") => ({
  url,
  method: "GET",
  headers: new Headers(),
  json: async () => ({}),
} as unknown as Request);

describe("GET /api/containers/[id]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { GET } = await import("@/app/api/containers/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(parseId).not.toHaveBeenCalled();
  });

  it("возвращает 400 при невалидном id", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue(
      NextResponse.json({ error: "Некорректный id контейнера" }, { status: HTTP_STATUS.BAD_REQUEST })
    );
    const { GET } = await import("@/app/api/containers/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "abc" }) });
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 404, если контейнер не найден", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue({ id: 999 });
    createClient.mockResolvedValue({});
    loadContainerDetail.mockResolvedValue({
      error: "Контейнер не найден",
      status: HTTP_STATUS.NOT_FOUND,
    });
    const { GET } = await import("@/app/api/containers/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "999" }) });
    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    const body = await response.json();
    expect(body.error).toBe("Контейнер не найден");
  });

  it("возвращает 200 и данные при успешной загрузке", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue({ id: 1 });
    createClient.mockResolvedValue({});
    const containerData = {
      container: { id: 1, name: "Контейнер" },
      transitions: [],
      items: [],
    };
    loadContainerDetail.mockResolvedValue(containerData);
    const { GET } = await import("@/app/api/containers/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(containerData);
    expect(loadContainerDetail).toHaveBeenCalledWith(expect.anything(), 1);
  });
});

describe("PUT /api/containers/[id]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { PUT } = await import("@/app/api/containers/[id]/route");
    const request = {
      url: "http://localhost/api/containers/1",
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ name: "Container" }),
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
    createClient.mockResolvedValue({ from: jest.fn(() => updateChain) });
    const { PUT } = await import("@/app/api/containers/[id]/route");
    const request = {
      url: "http://localhost/api/containers/1",
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
    const updatedContainer = {
      id: 1,
      name: "Updated Container",
      entity_type_id: null,
      photo_url: null,
    };
    const updateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: updatedContainer, error: null }),
    };
    createClient.mockResolvedValue({ from: jest.fn(() => updateChain) });
    const { PUT } = await import("@/app/api/containers/[id]/route");
    const request = {
      url: "http://localhost/api/containers/1",
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ name: "Updated Container" }),
    } as unknown as Request;
    const response = await PUT(request, { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(updatedContainer);
  });
});
