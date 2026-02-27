/**
 * Юнит-тесты для app/api/furniture/[id]/route.ts (GET: auth, parseId, успешная загрузка).
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

jest.mock("@/lib/places/api", () => ({
  getPlacesWithRoomRpc: jest.fn(),
}));

jest.mock("@/lib/entities/api", () => ({
  getItemsWithRoomRpc: jest.fn(),
}));

jest.mock("@/lib/containers/api", () => ({
  getContainersWithLocationRpc: jest.fn(),
}));

const requireAuthAndTenant = jest.requireMock("@/lib/shared/api/require-auth")
  .requireAuthAndTenant as jest.Mock;
const parseId = jest.requireMock("@/lib/shared/api/parse-id").parseId as jest.Mock;
const createClient = jest.requireMock("@/lib/shared/supabase/server")
  .createClient as jest.Mock;
const getPlacesWithRoomRpc = jest.requireMock("@/lib/places/api").getPlacesWithRoomRpc as jest.Mock;
const getItemsWithRoomRpc = jest.requireMock("@/lib/entities/api").getItemsWithRoomRpc as jest.Mock;
const getContainersWithLocationRpc = jest.requireMock("@/lib/containers/api")
  .getContainersWithLocationRpc as jest.Mock;

const createRequest = () => ({
  url: "http://localhost/api/furniture/1",
  method: "GET",
  headers: new Headers(),
  json: async () => ({}),
} as unknown as Request);

describe("GET /api/furniture/[id]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { GET } = await import("@/app/api/furniture/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(parseId).not.toHaveBeenCalled();
  });

  it("возвращает 400 при невалидном id", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue(
      NextResponse.json({ error: "Некорректный id" }, { status: HTTP_STATUS.BAD_REQUEST })
    );
    const { GET } = await import("@/app/api/furniture/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "abc" }) });
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 200 и данные при успешной загрузке", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    parseId.mockReturnValue({ id: 1 });
    const furnitureRow = {
      id: 1,
      name: "Шкаф",
      room_id: 10,
      photo_url: null,
      created_at: "2024-01-01",
      deleted_at: null,
      furniture_type_id: null,
      price_amount: null,
      price_currency: null,
      current_value_amount: null,
      current_value_currency: null,
      purchase_date: null,
    };
    const furnitureChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: furnitureRow, error: null }),
    };
    const roomChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { name: "Комната" }, error: null }),
    };
    const entityTypesChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    createClient.mockResolvedValue({
      from: jest.fn((table: string) => {
        if (table === "furniture") return furnitureChain;
        if (table === "rooms") return roomChain;
        if (table === "entity_types") return entityTypesChain;
        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null }) };
      }),
    });
    getPlacesWithRoomRpc.mockResolvedValue({ data: [] });
    getItemsWithRoomRpc.mockResolvedValue({ data: [] });
    getContainersWithLocationRpc.mockResolvedValue({ data: [] });

    const { GET } = await import("@/app/api/furniture/[id]/route");
    const response = await GET(createRequest(), { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.furniture).toBeDefined();
    expect(body.data.furniture.id).toBe(1);
    expect(body.data.furniture.name).toBe("Шкаф");
  });
});
