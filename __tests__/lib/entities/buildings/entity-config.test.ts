import {
  buildingsEntityConfig,
  DEFAULT_BUILDINGS_FILTERS,
  type BuildingsFilters,
} from "@/lib/entities/buildings/entity-config";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { getBuildings } from "@/lib/buildings/api";

jest.mock("@/lib/buildings/api");

describe("buildings entity-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("конфиг имеет обязательные поля EntityConfig", () => {
    expect(buildingsEntityConfig.kind).toBe("building");
    expect(buildingsEntityConfig.basePath).toBeDefined();
    expect(buildingsEntityConfig.apiTable).toBe("buildings");
    expect(buildingsEntityConfig.labels).toBeDefined();
    expect(buildingsEntityConfig.filters.initial).toEqual(DEFAULT_BUILDINGS_FILTERS);
    expect(buildingsEntityConfig.columns.length).toBeGreaterThan(0);
    expect(buildingsEntityConfig.fetch).toBeDefined();
    expect(buildingsEntityConfig.actions.whenActive.length).toBeGreaterThan(0);
  });

  it("filters.initial совпадает с DEFAULT_BUILDINGS_FILTERS", () => {
    expect(buildingsEntityConfig.filters.initial).toEqual(DEFAULT_BUILDINGS_FILTERS);
  });

  it("counts задан с filterParam buildingId и ссылкой на rooms", () => {
    expect(buildingsEntityConfig.counts?.filterParam).toBe("buildingId");
    expect(buildingsEntityConfig.counts?.links).toContainEqual(
      expect.objectContaining({ path: "/rooms", field: "rooms_count" })
    );
  });

  it("DEFAULT_BUILDINGS_FILTERS содержит showDeleted: false", () => {
    expect(DEFAULT_BUILDINGS_FILTERS).toEqual({ showDeleted: false });
  });

  it("buildingsEntityConfig имеет корректные labels и basePath", () => {
    expect(buildingsEntityConfig.basePath).toBe("/buildings");
    expect(buildingsEntityConfig.apiTable).toBe("buildings");
    expect(buildingsEntityConfig.labels.plural).toBe("Здания");
    expect(buildingsEntityConfig.labels.singular).toBe("Здание");
  });

  it("отображаемое имя по умолчанию (getEntityDisplayName): name если не пустой", () => {
    expect(getEntityDisplayName("building", 1, "Здание A")).toBe("Здание A");
  });

  it("отображаемое имя по умолчанию: 'Здание #id' если name пустой", () => {
    expect(getEntityDisplayName("building", 5, null)).toBe("Здание #5");
    expect(getEntityDisplayName("building", 5, "")).toBe("Здание #5");
    expect(getEntityDisplayName("building", 5, "   ")).toBe("Здание #5");
  });

  it("fetch вызывает getBuildings и возвращает data и totalCount", async () => {
    (getBuildings as jest.Mock).mockResolvedValue({
      data: [{ id: 1, name: "A" }],
      totalCount: 1,
    });

    const filters: BuildingsFilters = { showDeleted: false };
    const result = await buildingsEntityConfig.fetch!({
      query: "test",
      filterValues: filters,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result).toEqual({ data: [{ id: 1, name: "A" }], totalCount: 1 });
    expect(getBuildings).toHaveBeenCalledWith({
      query: "test",
      showDeleted: false,
      sortBy: "name",
      sortDirection: "asc",
    });
  });

  it("fetch обрабатывает response без totalCount", async () => {
    (getBuildings as jest.Mock).mockResolvedValue({
      data: [{ id: 1 }],
    });

    const result = await buildingsEntityConfig.fetch!({
      filterValues: { showDeleted: false },
    });

    expect(result.data).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });
});
