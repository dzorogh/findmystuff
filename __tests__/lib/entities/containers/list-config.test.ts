import {
  DEFAULT_CONTAINERS_FILTERS,
  CONTAINERS_LIST_CONFIG,
} from "@/lib/entities/containers/list-config";

describe("containers list-config", () => {
  it("DEFAULT_CONTAINERS_FILTERS задаёт начальные значения", () => {
    expect(DEFAULT_CONTAINERS_FILTERS).toEqual({
      showDeleted: false,
      entityTypeId: null,
      hasItems: null,
      locationType: null,
    });
  });

  it("CONTAINERS_LIST_CONFIG содержит resultsLabel", () => {
    expect(CONTAINERS_LIST_CONFIG.resultsLabel).toEqual({
      one: "контейнер",
      few: "контейнера",
      many: "контейнеров",
    });
  });

  it("getListDisplayName вызывается без ошибки", () => {
    const getListDisplayName = CONTAINERS_LIST_CONFIG.getListDisplayName!;
    expect(getListDisplayName({ id: 1, name: "Коробка" })).toBeDefined();
  });
});
