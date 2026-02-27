/**
 * Юнит-тесты для app/api/items/[id]/route.ts (GET: auth, parseId, успешная загрузка).
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

const createRequest = () => ({
  url: "http://localhost/api/items/1",
  method: "GET",
  headers: new Headers(),
  json: async () => ({}),
} as unknown as Request);

describe("GET /api/items/[id]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { GET } = await import("@/app/api/items/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(parseId).not.toHaveBeenCalled();
  });

  it("возвращает 400 при невалидном id", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue(
      NextResponse.json({ error: "Некорректный id вещи" }, { status: HTTP_STATUS.BAD_REQUEST })
    );
    const { GET } = await import("@/app/api/items/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "abc" }) });
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 200 и данные при успешной загрузке", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue({ id: 1 });
    const itemRow = {
      id: 1,
      name: "Вещь",
      created_at: "2024-01-01",
      deleted_at: null,
      photo_url: null,
      item_type_id: null,
      price_amount: null,
      price_currency: null,
      current_value_amount: null,
      current_value_currency: null,
      quantity: null,
      purchase_date: null,
      entity_types: null,
    };
    const itemsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: itemRow, error: null }),
    };
    createClient.mockResolvedValue({
      from: jest.fn(() => itemsChain),
    });

    const { GET } = await import("@/app/api/items/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.id).toBe(1);
    expect(body.data.name).toBe("Вещь");
  });
});
