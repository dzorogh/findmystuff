/**
 * Юнит-тесты для app/api/tenants/route.ts (GET и POST).
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

jest.mock("@/lib/shared/api/require-auth", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/shared/supabase/admin", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("@/lib/tenants/api", () => ({
  createTenantForCurrentUserRpc: jest.fn(),
}));

jest.mock("@/lib/tenants/seed-default-entity-types", () => ({
  seedDefaultEntityTypesForTenant: jest.fn(),
}));

const requireAuth = jest.requireMock("@/lib/shared/api/require-auth").requireAuth as jest.Mock;
const createClient = jest.requireMock("@/lib/shared/supabase/server").createClient as jest.Mock;
const getSupabaseAdmin = jest.requireMock("@/lib/shared/supabase/admin").getSupabaseAdmin as jest.Mock;
const createTenantForCurrentUserRpc = jest.requireMock("@/lib/tenants/api")
  .createTenantForCurrentUserRpc as jest.Mock;
const seedDefaultEntityTypesForTenant = jest.requireMock("@/lib/tenants/seed-default-entity-types")
  .seedDefaultEntityTypesForTenant as jest.Mock;

const createPostRequest = (body: { name?: string } = {}) => ({
  url: "http://localhost/api/tenants",
  method: "POST",
  headers: new Headers({ "Content-Type": "application/json" }),
  json: async () => body,
} as unknown as Request);

describe("POST /api/tenants", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    seedDefaultEntityTypesForTenant.mockResolvedValue(undefined);
    getSupabaseAdmin.mockReturnValue({});
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuth.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { POST } = await import("@/app/api/tenants/route");
    const response = await POST(createPostRequest({ name: "Склад" }) as never);
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(createTenantForCurrentUserRpc).not.toHaveBeenCalled();
  });

  it("возвращает 500 при ошибке создания тенанта", async () => {
    requireAuth.mockResolvedValue({ user: { id: "user-1" } });
    createClient.mockResolvedValue({});
    createTenantForCurrentUserRpc.mockRejectedValue(new Error("DB error"));
    const { POST } = await import("@/app/api/tenants/route");
    const response = await POST(createPostRequest({ name: "Склад" }) as never);
    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("возвращает 201 и данные тенанта при успехе", async () => {
    requireAuth.mockResolvedValue({ user: { id: "user-1" } });
    createClient.mockResolvedValue({});
    createTenantForCurrentUserRpc.mockResolvedValue({
      id: 1,
      name: "Мой склад",
      created_at: "2024-01-01T00:00:00Z",
    });
    const { POST } = await import("@/app/api/tenants/route");
    const response = await POST(createPostRequest({ name: "Мой склад" }) as never);
    expect(response.status).toBe(HTTP_STATUS.CREATED);
    const data = await response.json();
    expect(data.id).toBe(1);
    expect(data.name).toBe("Мой склад");
    expect(data.created_at).toBeDefined();
    expect(createTenantForCurrentUserRpc).toHaveBeenCalledWith(expect.anything(), "Мой склад");
  });

  it("использует имя по умолчанию при пустом body", async () => {
    requireAuth.mockResolvedValue({ user: { id: "user-1" } });
    createClient.mockResolvedValue({});
    createTenantForCurrentUserRpc.mockResolvedValue({
      id: 2,
      name: "Мой склад",
      created_at: "2024-01-02T00:00:00Z",
    });
    const { POST } = await import("@/app/api/tenants/route");
    await POST(createPostRequest({}) as never);
    expect(createTenantForCurrentUserRpc).toHaveBeenCalledWith(expect.anything(), "Мой склад");
  });
});

describe("GET /api/tenants", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuth.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { GET } = await import("@/app/api/tenants/route");
    const request = {
      url: "http://localhost/api/tenants",
      method: "GET",
      headers: new Headers(),
      json: async () => ({}),
    } as unknown as Request;
    const response = await GET(request as never);
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("возвращает 200 и список тенантов при успехе", async () => {
    requireAuth.mockResolvedValue({ user: { id: "user-1" } });
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ tenant: { id: 1, name: "Склад 1", created_at: "2024-01-01", deleted_at: null } }],
        error: null,
      }),
    };
    createClient.mockResolvedValue({ from: jest.fn(() => selectChain) });
    const { GET } = await import("@/app/api/tenants/route");
    const request = {
      url: "http://localhost/api/tenants",
      method: "GET",
      headers: new Headers(),
      json: async () => ({}),
    } as unknown as Request;
    const response = await GET(request as never);
    expect(response.status).toBe(HTTP_STATUS.OK);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0]).toEqual(expect.objectContaining({ id: 1, name: "Склад 1" }));
  });
});
