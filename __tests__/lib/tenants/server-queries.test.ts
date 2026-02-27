import { getServerTenantCount } from "@/lib/tenants/server-queries";

const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();

jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    from: mockFrom,
  })),
}));

describe("getServerTenantCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReset();
    mockSelect.mockReset();
    mockEq.mockReset();
  });

  it("возвращает количество тенантов пользователя при успешном запросе", async () => {
    mockEq.mockResolvedValue({ count: 3, error: null });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await getServerTenantCount("user-1");

    expect(mockFrom).toHaveBeenCalledWith("tenant_memberships");
    expect(mockSelect).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toBe(3);
  });

  it("возвращает 0 при ошибке запроса", async () => {
    mockEq.mockResolvedValue({ count: null, error: { message: "db error" } });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await getServerTenantCount("user-2");

    expect(result).toBe(0);
  });

  it("возвращает 0, если count не задан", async () => {
    mockEq.mockResolvedValue({ count: undefined, error: null });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await getServerTenantCount("user-3");

    expect(result).toBe(0);
  });
});

