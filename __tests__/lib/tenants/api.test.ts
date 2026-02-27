import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTenantForCurrentUserRpc,
  getTenants,
  createTenant,
  switchTenant,
} from "@/lib/tenants/api";

describe("createTenantForCurrentUserRpc", () => {
  it("возвращает данные при успешном RPC", async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: { id: 1, name: "T", created_at: "2024-01-01" },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await createTenantForCurrentUserRpc(supabase, "Test");

    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_tenant_for_current_user",
      { p_name: "Test" }
    );
    expect(result).toEqual({ id: 1, name: "T", created_at: "2024-01-01" });
  });

  it("бросает ошибку при error от RPC", async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "rpc error" },
      }),
    } as unknown as SupabaseClient;

    await expect(
      createTenantForCurrentUserRpc(supabase, "Test")
    ).rejects.toThrow("rpc error");
  });

  it("бросает ошибку, если data = null без error", async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as unknown as SupabaseClient;

    await expect(
      createTenantForCurrentUserRpc(supabase, "Test")
    ).rejects.toThrow("No tenant returned");
  });
});

describe("tenant API client (fetch)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getTenants возвращает список тенантов при ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: "A" }]),
    });

    const tenants = await getTenants();

    expect(global.fetch).toHaveBeenCalledWith("/api/tenants");
    expect(tenants).toEqual([{ id: 1, name: "A" }]);
  });

  it("getTenants бросает ошибку при !ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    await expect(getTenants()).rejects.toThrow("Failed to fetch tenants");
  });

  it("createTenant отправляет POST и возвращает тенант при ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: "X" }),
    });

    const tenant = await createTenant("X");

    expect(global.fetch).toHaveBeenCalledWith("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "X" }),
    });
    expect(tenant).toEqual({ id: 1, name: "X" });
  });

  it("createTenant бросает ошибку с сообщением из json", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Already exists" }),
    });

    await expect(createTenant("X")).rejects.toThrow("Already exists");
  });

  it("createTenant бросает generic ошибку при !ok и без error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("invalid json")),
    });

    await expect(createTenant("X")).rejects.toThrow("Failed to create tenant");
  });

  it("switchTenant отправляет POST и не бросает при ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    await expect(switchTenant(5)).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith("/api/tenants/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: 5 }),
      credentials: "same-origin",
    });
  });

  it("switchTenant бросает ошибку при !ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    await expect(switchTenant(5)).rejects.toThrow("Failed to switch tenant");
  });
});

