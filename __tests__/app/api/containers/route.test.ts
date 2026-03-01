/**
 * Минимальные тесты для app/api/containers/route.ts (GET и POST).
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

jest.mock("@/lib/shared/api/require-auth", () => ({
  requireAuthAndTenant: jest.fn(),
}));
jest.mock("@/lib/shared/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/containers/api", () => ({
  getContainersWithLocationRpc: jest.fn(),
}));
jest.mock("@/lib/shared/api/insert-entity-with-transition", () => ({
  insertEntityWithTransition: jest.fn(),
}));

const requireAuthAndTenant = jest.requireMock("@/lib/shared/api/require-auth")
  .requireAuthAndTenant as jest.Mock;
const getContainersWithLocationRpc = jest.requireMock("@/lib/containers/api")
  .getContainersWithLocationRpc as jest.Mock;
const insertEntityWithTransition = jest.requireMock("@/lib/shared/api/insert-entity-with-transition")
  .insertEntityWithTransition as jest.Mock;

const createGetRequest = (searchParams?: string) =>
  ({ url: `http://localhost/api/containers${searchParams ? `?${searchParams}` : ""}`, method: "GET", headers: new Headers() } as unknown as Request);

describe("GET /api/containers", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    const mockSupabase = {};
    jest.requireMock("@/lib/shared/supabase/server").createClient.mockResolvedValue(mockSupabase);
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { GET } = await import("@/app/api/containers/route");
    const response = await GET(createGetRequest());
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(getContainersWithLocationRpc).not.toHaveBeenCalled();
  });

  it("возвращает 200 и data + totalCount при успешной загрузке", async () => {
    getContainersWithLocationRpc.mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Box",
          entity_type_id: 1,
          entity_type_name: "Box",
          created_at: "2024-01-01T00:00:00Z",
          deleted_at: null,
          photo_url: null,
          items_count: 0,
          destination_type: null,
          destination_id: null,
          destination_name: null,
          moved_at: null,
          room_id: null,
          room_name: null,
          total_count: 1,
        },
      ],
      error: null,
    });
    const { GET } = await import("@/app/api/containers/route");
    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Box");
    expect(body.totalCount).toBe(1);
  });

  it("возвращает 200 с data [] и totalCount 0 при пустом результате", async () => {
    getContainersWithLocationRpc.mockResolvedValue({ data: [], error: null });
    const { GET } = await import("@/app/api/containers/route");
    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.totalCount).toBe(0);
  });
});

describe("POST /api/containers", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    jest.requireMock("@/lib/shared/supabase/server").createClient.mockResolvedValue({});
  });

  it("возвращает 400 при недопустимом destination_type", async () => {
    const { POST } = await import("@/app/api/containers/route");
    const request = {
      json: async () => ({ name: "C1", destination_type: "building", destination_id: 1 }),
      headers: new Headers(),
    } as unknown as Request;
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(insertEntityWithTransition).not.toHaveBeenCalled();
  });

  it("возвращает 201 при успешном создании с допустимым destination_type", async () => {
    insertEntityWithTransition.mockResolvedValue({ data: { id: 1, name: "C1" }, error: null });
    const { POST } = await import("@/app/api/containers/route");
    const request = {
      json: async () => ({ name: "C1", destination_type: "place", destination_id: 5 }),
      headers: new Headers(),
    } as unknown as Request;
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({ id: 1, name: "C1" });
  });
});
