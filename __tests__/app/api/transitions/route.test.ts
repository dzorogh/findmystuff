/**
 * Минимальные тесты для app/api/transitions/route.ts (POST).
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

jest.mock("@/lib/shared/api/require-auth", () => ({ requireAuthAndTenant: jest.fn() }));
jest.mock("@/lib/shared/supabase/server", () => ({ createClient: jest.fn() }));

const requireAuthAndTenant = jest.requireMock("@/lib/shared/api/require-auth")
  .requireAuthAndTenant as jest.Mock;

const createPostRequest = (body: object) =>
  ({
    json: async () => body,
    headers: new Headers(),
  } as unknown as Request);

describe("POST /api/transitions", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    const mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, destination_type: "place", destination_id: 1 },
              error: null,
            }),
          }),
        }),
      })),
    };
    jest.requireMock("@/lib/shared/supabase/server").createClient.mockResolvedValue(mockSupabase);
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { POST } = await import("@/app/api/transitions/route");
    const response = await POST(
      createPostRequest({ item_id: 1, destination_type: "place", destination_id: 1 })
    );
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("возвращает 400 при отсутствии destination_type или destination_id", async () => {
    const { POST } = await import("@/app/api/transitions/route");
    const response = await POST(createPostRequest({ item_id: 1 }));
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(
      body.error.includes("destination") || body.error.includes("Invalid") || body.error.includes("room")
    ).toBe(true);
  });

  it("возвращает 400 при недопустимом destination_type", async () => {
    const { POST } = await import("@/app/api/transitions/route");
    const response = await POST(
      createPostRequest({ item_id: 1, destination_type: "building", destination_id: 1 })
    );
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error).toMatch(/Invalid|room|place|container|furniture/);
  });
});
