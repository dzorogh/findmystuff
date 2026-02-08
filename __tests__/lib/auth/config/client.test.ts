jest.mock("better-auth/react", () => ({
  createAuthClient: jest.fn(() => ({})),
}));

import { authClient } from "@/lib/auth/config/client";

describe("auth config client", () => {
  it("экспортирует authClient", () => {
    expect(authClient).toBeDefined();
  });
});
