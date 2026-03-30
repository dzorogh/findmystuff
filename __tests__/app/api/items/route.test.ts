import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

jest.mock("@/lib/shared/api/require-auth", () => ({
  requireAuthAndTenant: jest.fn(),
}));
jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn(),
}));
jest.mock("@/lib/shared/api/insert-entity-with-transition", () => ({
  insertEntityWithTransition: jest.fn(),
}));
jest.mock("@/lib/shared/api/search-index-queue", () => ({
  enqueueSearchIndexJob: jest.fn(),
}));

const requireAuthAndTenant = jest.requireMock("@/lib/shared/api/require-auth")
  .requireAuthAndTenant as jest.Mock;
const createClient = jest.requireMock("@/lib/shared/supabase/server")
  .createClient as jest.Mock;
const insertEntityWithTransition = jest.requireMock("@/lib/shared/api/insert-entity-with-transition")
  .insertEntityWithTransition as jest.Mock;
const enqueueSearchIndexJob = jest.requireMock("@/lib/shared/api/search-index-queue")
  .enqueueSearchIndexJob as jest.Mock;

describe("POST /api/items", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    createClient.mockResolvedValue({});
    enqueueSearchIndexJob.mockResolvedValue(null);
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );

    const { POST } = await import("@/app/api/items/route");
    const response = await POST({
      json: async () => ({ name: "Item" }),
      headers: new Headers(),
    } as unknown as Request);

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it("ставит вещь в очередь индексации после успешного создания", async () => {
    insertEntityWithTransition.mockResolvedValue({
      data: { id: 12, name: "Item" },
      error: null,
    });

    const { POST } = await import("@/app/api/items/route");
    const response = await POST({
      json: async () => ({ name: "Item", quantity: 1 }),
      headers: new Headers({ "Content-Type": "application/json" }),
    } as unknown as Request);

    expect(response.status).toBe(200);
    expect(enqueueSearchIndexJob).toHaveBeenCalledWith(
      expect.anything(),
      {
        tenantId: 1,
        entityType: "item",
        entityId: 12,
      }
    );
  });

  it("не роняет create flow, если enqueue завершился ошибкой", async () => {
    insertEntityWithTransition.mockResolvedValue({
      data: { id: 12, name: "Item" },
      error: null,
    });
    enqueueSearchIndexJob.mockRejectedValue(new Error("queue down"));

    const { POST } = await import("@/app/api/items/route");
    const response = await POST({
      json: async () => ({ name: "Item", quantity: 1 }),
      headers: new Headers({ "Content-Type": "application/json" }),
    } as unknown as Request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({ id: 12, name: "Item" });
  });
});
