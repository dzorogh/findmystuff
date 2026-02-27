jest.mock("@/lib/shared/api/http-client", () => ({
  HttpClient: class {
    async request() {
      return { id: 1 };
    }
  },
}));

import { duplicateEntityApiClient } from "@/lib/shared/api/duplicate-entity";

describe("duplicateEntityApiClient", () => {
  it("экспортирует API с методом duplicate", () => {
    expect(duplicateEntityApiClient).toBeDefined();
    expect(typeof duplicateEntityApiClient.duplicate).toBe("function");
  });

  it("duplicate возвращает результат request", async () => {
    const res = await duplicateEntityApiClient.duplicate("rooms", 5);
    expect(res).toEqual({ id: 1 });
  });
});
