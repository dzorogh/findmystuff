import {
  DEFAULT_ENTITY_SORT,
  ENTITY_SORT_OPTIONS,
  getEntitySortParams,
  sortEntities,
  type EntitySortOption,
} from "@/lib/entities/helpers/sort";

describe("sort", () => {
  describe("getEntitySortParams", () => {
    it("возвращает sortBy и sortDirection для известного варианта", () => {
      expect(getEntitySortParams("created_desc")).toEqual({
        sortBy: "created_at",
        sortDirection: "desc",
      });
      expect(getEntitySortParams("created_asc")).toEqual({
        sortBy: "created_at",
        sortDirection: "asc",
      });
      expect(getEntitySortParams("name_asc")).toEqual({
        sortBy: "name",
        sortDirection: "asc",
      });
      expect(getEntitySortParams("name_desc")).toEqual({
        sortBy: "name",
        sortDirection: "desc",
      });
    });

    it("возвращает дефолт для неизвестного варианта", () => {
      expect(getEntitySortParams("unknown" as EntitySortOption)).toEqual({
        sortBy: "created_at",
        sortDirection: "desc",
      });
    });
  });

  describe("sortEntities", () => {
    const rows = [
      { id: 1, name: "Б", created_at: "2024-01-02T00:00:00Z" },
      { id: 2, name: "А", created_at: "2024-01-03T00:00:00Z" },
      { id: 3, name: "В", created_at: "2024-01-01T00:00:00Z" },
    ];

    it("сортирует по created_desc", () => {
      const out = sortEntities(rows, "created_desc");
      expect(out.map((r) => r.id)).toEqual([2, 1, 3]);
    });

    it("сортирует по created_asc", () => {
      const out = sortEntities(rows, "created_asc");
      expect(out.map((r) => r.id)).toEqual([3, 1, 2]);
    });

    it("сортирует по name_asc", () => {
      const out = sortEntities(rows, "name_asc");
      expect(out.map((r) => r.name)).toEqual(["А", "Б", "В"]);
    });

    it("сортирует по name_desc", () => {
      const out = sortEntities(rows, "name_desc");
      expect(out.map((r) => r.name)).toEqual(["В", "Б", "А"]);
    });

    it("не мутирует исходный массив", () => {
      const copy = [...rows];
      sortEntities(rows, "name_asc");
      expect(rows).toEqual(copy);
    });

    it("обрабатывает пустые name и created_at", () => {
      const withNulls = [
        { id: 1, name: "X", created_at: null },
        { id: 2, name: null, created_at: "2024-01-01T00:00:00Z" },
        { id: 3, name: "", created_at: null },
      ];
      const out = sortEntities(withNulls, "name_asc");
      expect(out.length).toBe(3);
    });

    it("при сортировке по дате с одинаковой датой использует name как вторичный ключ", () => {
      const sameDate = [
        { id: 1, name: "Б", created_at: "2024-01-01T00:00:00Z" },
        { id: 2, name: "А", created_at: "2024-01-01T00:00:00Z" },
      ];
      const out = sortEntities(sameDate, "created_desc");
      expect(out.map((r) => r.name)).toEqual(["А", "Б"]);
    });
  });

  describe("constants", () => {
    it("DEFAULT_ENTITY_SORT", () => {
      expect(DEFAULT_ENTITY_SORT).toBe("created_desc");
    });
    it("ENTITY_SORT_OPTIONS содержит все варианты", () => {
      expect(ENTITY_SORT_OPTIONS.map((o) => o.value)).toEqual([
        "created_desc",
        "created_asc",
        "name_asc",
        "name_desc",
      ]);
    });
  });
});
