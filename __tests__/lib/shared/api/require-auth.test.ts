jest.mock("next/server");

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import {
  requireAuth,
  requireTenant,
  requireAuthAndTenant,
} from "@/lib/shared/api/require-auth";

jest.mock("@/lib/users/server", () => ({
  getServerUser: jest.fn(),
}));

jest.mock("@/lib/tenants/server", () => ({
  getActiveTenantId: jest.fn(),
}));

const { getServerUser } = jest.requireMock("@/lib/users/server") as {
  getServerUser: jest.Mock;
};

const { getActiveTenantId } = jest.requireMock("@/lib/tenants/server") as {
  getActiveTenantId: jest.Mock;
};

const createRequest = (): NextRequest =>
  ({ headers: new Headers() } as unknown as NextRequest);

describe("require-auth helpers", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("requireAuth", () => {
    it("возвращает 401, если пользователь не найден", async () => {
      getServerUser.mockResolvedValue(null);

      const result = await requireAuth(createRequest());

      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      const body = await res.json();
      expect(body).toEqual({ error: "Не авторизован" });
    });

    it("возвращает пользователя при успешной авторизации", async () => {
      const user = { id: "123" };
      getServerUser.mockResolvedValue(user);

      const result = await requireAuth(createRequest());

      expect(result).toEqual({ user });
    });
  });

  describe("requireTenant", () => {
    it("возвращает 400, если tenantId не найден", async () => {
      getActiveTenantId.mockResolvedValue(null);

      const result = await requireTenant(createRequest());

      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      const body = await res.json();
      expect(body).toEqual({
        error: "Выберите тенант или создайте склад",
      });
    });

    it("возвращает tenantId при успешной проверке", async () => {
      getActiveTenantId.mockResolvedValue(42);

      const result = await requireTenant(createRequest());

      expect(result).toEqual({ tenantId: 42 });
    });
  });

  describe("requireAuthAndTenant", () => {
    it("пробрасывает результат requireAuth, если он вернул NextResponse", async () => {
      getServerUser.mockResolvedValue(null);

      const result = await requireAuthAndTenant(createRequest());

      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it("пробрасывает результат requireTenant, если он вернул NextResponse", async () => {
      getServerUser.mockResolvedValue({ id: "u1" });
      getActiveTenantId.mockResolvedValue(null);

      const result = await requireAuthAndTenant(createRequest());

      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it("возвращает и user, и tenantId при успехе", async () => {
      const user = { id: "u1" };
      getServerUser.mockResolvedValue(user);
      getActiveTenantId.mockResolvedValue(7);

      const result = await requireAuthAndTenant(createRequest());

      expect(result).toEqual({ user, tenantId: 7 });
    });
  });
});


