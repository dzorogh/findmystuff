import { getActiveTenantId, setTenantCookieInResponse } from "@/lib/tenants/server";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const { cookies } = jest.requireMock("next/headers") as {
  cookies: jest.Mock;
};

describe("getActiveTenantId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает tenantId из заголовка x-tenant-id", async () => {
    const headers = new Headers();
    headers.set("x-tenant-id", "12");

    const id = await getActiveTenantId(headers);

    expect(id).toBe(12);
    expect(cookies).not.toHaveBeenCalled();
  });

  it("возвращает tenantId из cookie, если заголовка нет", async () => {
    cookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: "7" }),
    });

    const id = await getActiveTenantId();

    expect(id).toBe(7);
    expect(cookies).toHaveBeenCalled();
  });

  it("возвращает null, если cookie не задан", async () => {
    cookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const id = await getActiveTenantId();

    expect(id).toBeNull();
  });
});

describe("setTenantCookieInResponse", () => {
  it("формирует корректную строку Set-Cookie", () => {
    const cookie = setTenantCookieInResponse(5, 1);

    expect(cookie).toContain("tenant_id=5");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=");
    expect(cookie).toContain("SameSite=Lax");
  });
});

