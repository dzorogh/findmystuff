import {
  getUsers,
  getClientUser,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/users/api";

describe("users/api", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("getUsers вызывает /users и возвращает users", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { users: [{ id: "1", email: "a@b.com" }] } }),
    });

    const result = await getUsers();

    expect(global.fetch).toHaveBeenCalledWith("/api/users", expect.any(Object));
    expect(result.data?.users).toHaveLength(1);
  });

  it("createUser вызывает POST /users", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { user: { id: "1" }, password: "x" } }),
    });

    await createUser({ email: "new@example.com" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "new@example.com" }),
      })
    );
  });

  it("updateUser вызывает PUT /users", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { user: { id: "1" }, password: "x" } }),
    });

    await updateUser({ id: "1", email: "updated@example.com" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ id: "1", email: "updated@example.com" }),
      })
    );
  });

  it("deleteUser вызывает DELETE /users?id=...", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { success: true } }),
    });

    await deleteUser("1");

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/api/users?id=1");
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe("DELETE");
  });

  it("getUsers возвращает error при raw.error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const result = await getUsers();

    expect(result.error).toBe("Server error");
  });

  it("getUsers обрабатывает ответ с users в корне", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: [{ id: "1", email: "a@b.com" }] }),
    });

    const result = await getUsers();

    expect(result.data?.users).toHaveLength(1);
    expect(result.data?.users?.[0].email).toBe("a@b.com");
  });

  it("getClientUser возвращает user при успехе", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { user: { id: "u1", email: "u@b.com" } } }),
    });

    const result = await getClientUser();

    expect(result).toEqual({ id: "u1", email: "u@b.com" });
  });

  it("getClientUser возвращает null при ошибке", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const result = await getClientUser();

    expect(result).toBeNull();
  });
});
