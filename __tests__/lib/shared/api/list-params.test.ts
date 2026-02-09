import {
  normalizeSortParams,
  appendSortParams,
} from "@/lib/shared/api/list-params";

describe("list-params", () => {
  describe("normalizeSortParams", () => {
    it("возвращает name/asc при переданных name и asc", () => {
      expect(normalizeSortParams("name", "asc")).toEqual({
        sortBy: "name",
        sortDirection: "asc",
      });
    });

    it("возвращает created_at/desc по умолчанию при неизвестных значениях", () => {
      expect(normalizeSortParams("other", "other")).toEqual({
        sortBy: "created_at",
        sortDirection: "desc",
      });
    });
  });

  describe("appendSortParams", () => {
    it("добавляет sortBy и sortDirection в URLSearchParams", () => {
      const params = new URLSearchParams();
      appendSortParams(params, "name", "asc");
      expect(params.get("sortBy")).toBe("name");
      expect(params.get("sortDirection")).toBe("asc");
    });
  });
});
