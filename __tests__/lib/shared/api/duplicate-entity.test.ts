jest.mock("@/lib/shared/api/http-client", () => ({
  HttpClient: class {
    async request() {
      return { id: 1 };
    }
  },
}));

import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";

describe("duplicateEntityApi", () => {
  it("экспортирует API с методом duplicate", () => {
    expect(duplicateEntityApi).toBeDefined();
    expect(typeof duplicateEntityApi.duplicate).toBe("function");
  });

  it("duplicate возвращает результат request", async () => {
    const res = await duplicateEntityApi.duplicate("rooms", 5);
    expect(res).toEqual({ id: 1 });
  });
});
