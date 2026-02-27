import {
  listPageUrlParsers,
  urlStateToFilters,
  filtersToUrlState,
  createListPageParsers,
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
  });

  describe("createListPageParsers", () => {
    it("возвращает базовые парсеры, если defaultSort не задан", () => {
      const parsers = createListPageParsers();
      expect(parsers).toBe(listPageUrlParsers);
    });

    it("переопределяет сортировку по умолчанию при переданном defaultSort", () => {
      const parsers = createListPageParsers({
        sortBy: "name",
        sortDirection: "asc",
      });

      expect(parsers).not.toBe(listPageUrlParsers);
      expect(Object.keys(parsers)).toEqual(Object.keys(listPageUrlParsers));
    });
  });

  describe("yesNoAll parser (hasPhoto)", () => {
    it("корректно парсит и сериализует значения", () => {
      const parser: any = listPageUrlParsers.hasPhoto;

      expect(parser.parse("true")).toBe(true);
      expect(parser.parse("false")).toBe(false);
      expect(parser.parse(undefined)).toBe(null);
      expect(parser.parse("other")).toBe(null);

      expect(parser.serialize(true)).toBe("true");
      expect(parser.serialize(false)).toBe("false");
      expect(parser.serialize(null)).toBe("");
    });
  });
});
