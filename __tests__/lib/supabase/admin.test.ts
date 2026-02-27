import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn((url, key, options) => ({
    url,
    key,
    options,
    type: "admin",
  })),
}));

describe("getSupabaseAdmin", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it("создает и кеширует админский клиент Supabase", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";

    const { createClient } = require("@supabase/supabase-js") as {
      createClient: jest.Mock;
    };
    const { getSupabaseAdmin } = require("@/lib/shared/supabase/admin") as {
      getSupabaseAdmin: () => any;
    };

    const client1 = getSupabaseAdmin();
    const client2 = getSupabaseAdmin();

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(client1).toBe(client2);
    expect(client1.url).toBe("https://project.supabase.co");
    expect(client1.key).toBe("service-key");
    expect(client1.type).toBe("admin");
  });

  it("бросает ошибку, если переменные окружения не заданы", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { getSupabaseAdmin } = require("@/lib/shared/supabase/admin") as {
      getSupabaseAdmin: () => any;
    };

    expect(() => getSupabaseAdmin()).toThrow(
      "Missing Supabase environment variables",
    );
  });
});

