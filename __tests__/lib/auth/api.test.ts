import { getCurrentUser } from "@/lib/auth/api";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

describe("auth/api getCurrentUser", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("возвращает user при успешном ответе", async () => {
    const mockUser = { id: "1", email: "test@example.com" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { user: mockUser } }),
    });

    const result = await getCurrentUser();

    expect(result.data?.user).toEqual(mockUser);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/user",
      expect.any(Object)
    );
  });

  it("возвращает error при неуспешном ответе", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: HTTP_STATUS.UNAUTHORIZED,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const result = await getCurrentUser();

    expect(result.error).toBe("Unauthorized");
  });
});
