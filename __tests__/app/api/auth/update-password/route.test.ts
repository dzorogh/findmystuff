/**
 * Юнит-тесты для app/api/auth/update-password/route.ts (POST).
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

jest.mock("@/lib/shared/api/require-auth", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn(),
}));

const requireAuth = jest.requireMock("@/lib/shared/api/require-auth").requireAuth as jest.Mock;
const createClient = jest.requireMock("@/lib/shared/supabase/server").createClient as jest.Mock;

const createRequest = (body: { password?: string } = {}) => ({
  url: "http://localhost/api/auth/update-password",
  method: "POST",
  headers: new Headers({ "Content-Type": "application/json" }),
  json: async () => body,
} as unknown as Request);

describe("POST /api/auth/update-password", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuth.mockResolvedValue(
      NextResponse.json({ error: "Не авторизован" }, { status: HTTP_STATUS.UNAUTHORIZED })
    );
    const { POST } = await import("@/app/api/auth/update-password/route");
    const response = await POST(createRequest({ password: "validpass123" }) as never);
    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 400 при коротком пароле", async () => {
    requireAuth.mockResolvedValue({ user: { id: "user-1" } });
    const { POST } = await import("@/app/api/auth/update-password/route");
    const response = await POST(createRequest({ password: "12345" }) as never);
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const data = await response.json();
    expect(data.error).toContain("не менее 6");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 400 при пустом пароле", async () => {
    requireAuth.mockResolvedValue({ user: { id: "user-1" } });
    const { POST } = await import("@/app/api/auth/update-password/route");
    const response = await POST(createRequest({ password: "" }) as never);
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 200 при успешном обновлении пароля", async () => {
    requireAuth.mockResolvedValue({ user: { id: "user-1" } });
    const updateUser = jest.fn().mockResolvedValue({ error: null });
    createClient.mockResolvedValue({ auth: { updateUser } });
    const { POST } = await import("@/app/api/auth/update-password/route");
    const response = await POST(createRequest({ password: "newSecurePass123" }) as never);
    expect(response.status).toBe(HTTP_STATUS.OK);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({ password: "newSecurePass123" });
  });

  it("возвращает 400 при ошибке Supabase updateUser", async () => {
    requireAuth.mockResolvedValue({ user: { id: "user-1" } });
    createClient.mockResolvedValue({
      auth: { updateUser: jest.fn().mockResolvedValue({ error: { message: "Weak password" } }) },
    });
    const { POST } = await import("@/app/api/auth/update-password/route");
    const response = await POST(createRequest({ password: "validpass123" }) as never);
    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const data = await response.json();
    expect(data.error).toBe("Weak password");
  });
});
