import {
  DEFAULT_PLACES_FILTERS,
  PLACES_LIST_CONFIG,
} from "@/lib/entities/places/list-config";

describe("places list-config", () => {
  it("DEFAULT_PLACES_FILTERS задаёт начальные значения", () => {
    expect(DEFAULT_PLACES_FILTERS).toEqual({
      showDeleted: false,
      entityTypeId: null,
      roomId: null,
    });
  });

  it("PLACES_LIST_CONFIG содержит resultsLabel и moveFormConfig", () => {
    expect(PLACES_LIST_CONFIG.resultsLabel.many).toBe("мест");
    expect(PLACES_LIST_CONFIG.moveFormConfig.enabled).toBe(true);
  });

  it("getListDisplayName возвращает имя или fallback по id", () => {
    const getListDisplayName = PLACES_LIST_CONFIG.getListDisplayName!;
    expect(getListDisplayName({ id: 1, name: "Полка" })).toBe("Полка");
    expect(getListDisplayName({ id: 2, name: null })).toBe("Место #2");
  });
});
