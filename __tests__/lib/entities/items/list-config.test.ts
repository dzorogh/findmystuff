import {
  DEFAULT_ITEMS_FILTERS,
  ITEMS_LIST_CONFIG,
} from "@/lib/entities/items/list-config";

describe("items list-config", () => {
  it("DEFAULT_ITEMS_FILTERS задаёт начальные значения", () => {
    expect(DEFAULT_ITEMS_FILTERS).toEqual({
      showDeleted: false,
      locationType: null,
      hasPhoto: null,
      roomId: null,
    });
  });

  it("ITEMS_LIST_CONFIG содержит columnsConfig с movedAt", () => {
    const keys = ITEMS_LIST_CONFIG.columnsConfig.map((c) => c.key);
    expect(keys).toContain("movedAt");
  });

  it("getListDisplayName возвращает имя или fallback по id", () => {
    const getListDisplayName = ITEMS_LIST_CONFIG.getListDisplayName!;
    expect(getListDisplayName({ id: 1, name: "Книга" })).toBe("Книга");
    expect(getListDisplayName({ id: 2, name: "" })).toBe("Вещь #2");
  });
});
