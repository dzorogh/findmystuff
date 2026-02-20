import {
  listPageUrlParsers,
  createListPageParsers,
  urlStateToFilters,
  filtersToUrlState,
} from "@/lib/app/hooks/list-page-url-state";

describe("list-page-url-state", () => {
  describe("urlStateToFilters", () => {
    it("копирует initialFilters и добавляет значения из urlState для совпадающих ключей", () => {
      const initial = { showDeleted: false, roomId: null as number | null };
      const urlState = { showDeleted: true, roomId: 5 };

      const result = urlStateToFilters(urlState, initial);

      expect(result).toEqual({ showDeleted: true, roomId: 5 });
    });

    it("не добавляет ключи из urlState, которых нет в initialFilters", () => {
      const initial = { showDeleted: false };
      const urlState = { showDeleted: true, buildingId: 1 };

      const result = urlStateToFilters(urlState, initial);

      expect(result).toEqual({ showDeleted: true });
    });

    it("оставляет initial если urlState не содержит ключа", () => {
      const initial = { showDeleted: false, roomId: null as number | null };
      const urlState = { showDeleted: true };

      const result = urlStateToFilters(urlState, initial);

      expect(result.showDeleted).toBe(true);
      expect(result.roomId).toBeNull();
    });
  });

  describe("filtersToUrlState", () => {
    it("извлекает из filters только ключи из initialFilters и listPageUrlParsers", () => {
      const initial = { showDeleted: false, roomId: null as number | null };
      const filters = { showDeleted: true, roomId: 10 };

      const result = filtersToUrlState(filters, initial);

      expect(result).toEqual({ showDeleted: true, roomId: 10 });
    });

    it("не включает ключи из filters, которых нет в initialFilters", () => {
      const initial = { showDeleted: false };
      const filters = { showDeleted: true, buildingId: 1 };

      const result = filtersToUrlState(filters, initial);

      expect(result).toEqual({ showDeleted: true });
    });

    it("не включает ключ из initialFilters, которого нет в filters", () => {
      const initial = { showDeleted: false, roomId: null as number | null };
      const filters = { showDeleted: true };

      const result = filtersToUrlState(filters, initial);

      expect(result).toEqual({ showDeleted: true });
    });
  });

  describe("listPageUrlParsers", () => {
    it("содержит ожидаемые ключи парсеров", () => {
      expect(listPageUrlParsers).toHaveProperty("search");
      expect(listPageUrlParsers).toHaveProperty("page");
      expect(listPageUrlParsers).toHaveProperty("sortBy");
      expect(listPageUrlParsers).toHaveProperty("showDeleted");
      expect(listPageUrlParsers).toHaveProperty("roomId");
      expect(listPageUrlParsers).toHaveProperty("furnitureId");
    });

    it("hasPhoto парсит true/false/пусто/другое", () => {
      const p = listPageUrlParsers.hasPhoto as { parse: (v: string) => boolean | null; serialize: (v: boolean | null) => string };
      expect(p.parse("true")).toBe(true);
      expect(p.parse("false")).toBe(false);
      expect(p.parse("")).toBeNull();
      expect(p.parse("other")).toBeNull();
    });

    it("hasPhoto сериализует true/false", () => {
      const p = listPageUrlParsers.hasPhoto as { serialize: (v: boolean | null) => string };
      expect(p.serialize(true)).toBe("true");
      expect(p.serialize(false)).toBe("false");
      expect(p.serialize(null)).toBe("");
    });
  });

  describe("createListPageParsers", () => {
    it("без defaultSort возвращает listPageUrlParsers", () => {
      const parsers = createListPageParsers();
      expect(parsers).toBe(listPageUrlParsers);
    });

    it("с defaultSort подставляет sortBy и sortDirection по умолчанию", () => {
      const parsers = createListPageParsers({
        sortBy: "name",
        sortDirection: "asc",
      });
      expect(parsers.sortBy).not.toBe(listPageUrlParsers.sortBy);
      expect(parsers.sortBy.parse("name")).toBe("name");
      expect(parsers.sortDirection.parse("asc")).toBe("asc");
    });
  });
});
