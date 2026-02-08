import {
  DEFAULT_ROOMS_FILTERS,
  ROOMS_LIST_CONFIG,
  type RoomsFilters,
} from "@/lib/entities/rooms/list-config";

describe("rooms list-config", () => {
  it("DEFAULT_ROOMS_FILTERS задаёт начальные значения", () => {
    expect(DEFAULT_ROOMS_FILTERS).toEqual({
      showDeleted: false,
      hasItems: null,
      hasContainers: null,
      hasPlaces: null,
    });
  });

  it("ROOMS_LIST_CONFIG содержит filterConfig, columnsConfig, resultsLabel", () => {
    expect(ROOMS_LIST_CONFIG.resultsLabel).toEqual({
      one: "помещение",
      few: "помещения",
      many: "помещений",
    });
    expect(ROOMS_LIST_CONFIG.filterConfig.length).toBeGreaterThan(0);
    expect(ROOMS_LIST_CONFIG.columnsConfig.map((c) => c.key)).toContain("name");
  });

  it("getListDisplayName возвращает имя или fallback по id", () => {
    const getListDisplayName = ROOMS_LIST_CONFIG.getListDisplayName!;
    expect(getListDisplayName({ id: 1, name: "Кабинет" })).toBe("Кабинет");
    expect(getListDisplayName({ id: 2, name: "" })).toBe("Помещение #2");
    expect(getListDisplayName({ id: 3, name: null })).toBe("Помещение #3");
  });
});
