import {
  getTenants,
  createTenant,
  switchTenant,
  createTenantRpc,
} from "@/lib/tenants/api";

describe("lib/tenants/api", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("getTenants", () => {
    it("возвращает массив тенантов при ok", async () => {
      const tenants = [
        { id: 1, name: "Tenant 1", created_at: "2020-01-01T00:00:00Z" },
      ];
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(tenants),
      });

      const result = await getTenants();

      expect(result).toEqual(tenants);
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/tenants");
    });

    it("бросает при !res.ok", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(getTenants()).rejects.toThrow("Failed to fetch tenants");
    });
  });

  describe("createTenant", () => {
    it("возвращает тенанта при ok", async () => {
      const tenant = {
        id: 2,
        name: "New",
        created_at: "2020-01-01T00:00:00Z",
      };
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(tenant),
      });

      const result = await createTenant("New");

      expect(result).toEqual(tenant);
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New" }),
      });
    });

    it("бросает с текстом из err.error при !res.ok", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Name required" }),
      });

      await expect(createTenant("x")).rejects.toThrow("Name required");
    });

    it("бросает дефолтное сообщение при !res.ok и без body", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.reject(new Error("invalid json")),
      });

      await expect(createTenant("x")).rejects.toThrow("Failed to create tenant");
    });
  });

  describe("switchTenant", () => {
    it("резолвится при ok", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await switchTenant(1);

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/tenants/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: 1 }),
        credentials: "same-origin",
      });
    });

    it("бросает при !res.ok", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(switchTenant(1)).rejects.toThrow("Failed to switch tenant");
    });
  });

  describe("createTenantRpc", () => {
    it("вызывает supabase.rpc с параметрами", () => {
      const rpc = jest.fn().mockReturnValue({});
      const supabase = { rpc } as unknown as Parameters<typeof createTenantRpc>[0];

      createTenantRpc(supabase, { p_name: "Test" });

      expect(rpc).toHaveBeenCalledWith("create_tenant_for_current_user", {
        p_name: "Test",
      });
    });
  });
});
