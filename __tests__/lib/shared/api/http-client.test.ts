import { HttpClient } from "@/lib/shared/api/http-client";

describe("HttpClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("возвращает data при успешном ответе", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    class TestClient extends HttpClient {
      async get() {
        return this.request<{ id: number }>("/test");
      }
    }

    const client = new TestClient();
    const result = await client.get();

    expect(result.data).toEqual({ id: 1 });
    expect(result.error).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("возвращает error при !response.ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    });

    class TestClient extends HttpClient {
      async get() {
        return this.request("/test");
      }
    }

    const client = new TestClient();
    const result = await client.get();

    expect(result.error).toBe("Not found");
    expect(result.data).toBeUndefined();
  });

  it("возвращает сообщение по умолчанию при !response.ok без error в json", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    class TestClient extends HttpClient {
      async get() {
        return this.request("/test");
      }
    }

    const client = new TestClient();
    const result = await client.get();

    expect(result.error).toContain("500");
    expect(result.data).toBeUndefined();
  });

  it("пробрасывает ошибку при исключении в fetch", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    class TestClient extends HttpClient {
      async get() {
        return this.request("/test");
      }
    }

    const client = new TestClient();
    await expect(client.get()).rejects.toThrow("Network error");
  });

  it("apiBaseUrl возвращает /api", () => {
    class TestClient extends HttpClient {
      getBaseUrl() {
        return this.apiBaseUrl;
      }
    }
    const client = new TestClient();
    expect(client.getBaseUrl()).toBe("/api");
  });
});
