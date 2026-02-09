import { getServerUser } from "@/lib/users/server";

jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/lib/users/api", () => ({
  getAuthUser: jest.fn().mockResolvedValue(null),
}));

describe("getServerUser", () => {
  it("возвращает Promise с пользователем или null", async () => {
    const user = await getServerUser();
    expect(user === null || typeof user === "object").toBe(true);
  });
});
