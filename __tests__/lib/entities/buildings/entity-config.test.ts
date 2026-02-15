import {
  buildingsEntityConfig,
  DEFAULT_BUILDINGS_FILTERS,
  type BuildingsFilters,
} from "@/lib/entities/buildings/entity-config";
import { getBuildings } from "@/lib/buildings/api";

jest.mock("@/lib/buildings/api");

describe("buildings entity-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("getName возвращает name если не пустой", () => {
    const getName = buildingsEntityConfig.getName!;
    expect(getName({ id: 1, name: "Здание A" } as { id: number; name: string | null })).toBe(
      "Здание A"
    );
  });

  it("getName возвращает 'Здание #id' если name пустой", () => {
    const getName = buildingsEntityConfig.getName!;
    expect(getName({ id: 5, name: null } as { id: number; name: string | null })).toBe("Здание #5");
    expect(getName({ id: 5, name: "" } as { id: number; name: string | null })).toBe("Здание #5");
    expect(getName({ id: 5, name: "   " } as { id: number; name: string | null })).toBe("Здание #5");
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
