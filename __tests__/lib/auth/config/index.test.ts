jest.mock("@/lib/shared/supabase/database-url", () => ({
  getDatabaseUrl: () => "postgres://localhost/test",
}));
jest.mock("better-auth", () => ({
  betterAuth: jest.fn(() => ({})),
}));
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({})),
}));

describe("auth config index", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NEXT_PUBLIC_APP_URL: "http://localhost:3000" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("getAuth выбрасывает ошибку если NEXT_PUBLIC_APP_URL не задан", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { getAuth } = require("@/lib/auth/config/index");
    expect(() => getAuth()).toThrow("NEXT_PUBLIC_APP_URL");
  });

  it("getAuth возвращает экземпляр при заданном NEXT_PUBLIC_APP_URL", () => {
    const { getAuth } = require("@/lib/auth/config/index");
    const auth = getAuth();
    expect(auth).toBeDefined();
    expect(getAuth()).toBe(auth);
  });
});
