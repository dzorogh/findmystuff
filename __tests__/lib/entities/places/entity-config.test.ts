import {
  placesEntityConfig,
  DEFAULT_PLACES_FILTERS,
  type PlacesFilters,
} from "@/lib/entities/places/entity-config";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { getPlaces } from "@/lib/places/api";

jest.mock("@/lib/places/api");

describe("places entity-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("DEFAULT_PLACES_FILTERS содержит ожидаемые поля", () => {
    expect(DEFAULT_PLACES_FILTERS).toEqual({
      showDeleted: false,
      entityTypeId: null,
      roomId: null,
      furnitureId: null,
    });
  });

  it("конфиг имеет обязательные поля EntityConfig", () => {
    expect(placesEntityConfig.kind).toBe("place");
    expect(placesEntityConfig.basePath).toBeDefined();
    expect(placesEntityConfig.apiTable).toBe("places");
    expect(placesEntityConfig.labels).toBeDefined();
    expect(placesEntityConfig.filters.initial).toEqual(DEFAULT_PLACES_FILTERS);
    expect(placesEntityConfig.columns.length).toBeGreaterThan(0);
    expect(placesEntityConfig.fetch).toBeDefined();
    expect(placesEntityConfig.actions.whenActive.length).toBeGreaterThan(0);
  });

  it("placesEntityConfig имеет корректные kind, basePath, apiTable и labels", () => {
    expect(placesEntityConfig.kind).toBe("place");
    expect(placesEntityConfig.basePath).toBe("/places");
    expect(placesEntityConfig.apiTable).toBe("places");
    expect(placesEntityConfig.labels.plural).toBe("Места");
    expect(placesEntityConfig.labels.singular).toBe("Место");
    expect(placesEntityConfig.labels.results).toEqual({ one: "место", few: "места", many: "мест" });
  });

  it("filters.initial совпадает с DEFAULT_PLACES_FILTERS", () => {
    expect(placesEntityConfig.filters.initial).toEqual(DEFAULT_PLACES_FILTERS);
  });

  it("columns не пустой и содержит ключевые колонки", () => {
    expect(placesEntityConfig.columns.length).toBeGreaterThan(0);
    const keys = placesEntityConfig.columns.map((c) => c.key);
    expect(keys).toContain("id");
    expect(keys).toContain("name");
    expect(keys).toContain("actions");
  });

  it("отображаемое имя по умолчанию (getEntityDisplayName): name если не пустой", () => {
    expect(getEntityDisplayName("place", 1, "Полка")).toBe("Полка");
  });

  it("отображаемое имя по умолчанию: 'Место #id' если name пустой", () => {
    expect(getEntityDisplayName("place", 3, null)).toBe("Место #3");
    expect(getEntityDisplayName("place", 3, "")).toBe("Место #3");
  });

  it("fetch вызывает getPlaces и возвращает data", async () => {
    (getPlaces as jest.Mock).mockResolvedValue({
      data: [{ id: 1, name: "Place" }],
    });

    const filters: PlacesFilters = {
      showDeleted: false,
      entityTypeId: null,
      roomId: null,
      furnitureId: null,
    };

    const result = await placesEntityConfig.fetch({
      query: "test",
      filterValues: filters,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({ id: 1, name: "Place" });
    expect(getPlaces).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "test",
        showDeleted: false,
        sortBy: "name",
        sortDirection: "asc",
      })
    );
  });

  it("fetch передаёт entityTypeId, roomId, furnitureId в getPlaces", async () => {
    (getPlaces as jest.Mock).mockResolvedValue({ data: [] });

    await placesEntityConfig.fetch({
      filterValues: {
        showDeleted: false,
        entityTypeId: 5,
        roomId: 1,
        furnitureId: 2,
      } as PlacesFilters,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(getPlaces).toHaveBeenCalledWith(
      expect.objectContaining({
        entityTypeId: 5,
        roomId: 1,
        furnitureId: 2,
      })
    );
  });

  it("fetch при не-массиве response.data возвращает пустой массив", async () => {
    (getPlaces as jest.Mock).mockResolvedValue({ data: null });

    const result = await placesEntityConfig.fetch({
      filterValues: DEFAULT_PLACES_FILTERS,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toEqual([]);
  });

  it("groupBy возвращает furniture_name если не пустой", () => {
    const groupBy = placesEntityConfig.groupBy!;
    expect(
      groupBy({ id: 1, name: "X", furniture_name: "Стол" } as { id: number; name: string | null; furniture_name?: string })
    ).toBe("Стол");
  });

  it("groupBy возвращает null если furniture_name пустой", () => {
    const groupBy = placesEntityConfig.groupBy!;
    expect(groupBy({ id: 1, name: "X" } as { id: number; name: string | null; furniture_name?: string })).toBeNull();
    expect(
      groupBy({ id: 1, name: "X", furniture_name: "" } as { id: number; name: string | null; furniture_name?: string })
    ).toBeNull();
    expect(
      groupBy({ id: 1, name: "X", furniture_name: "   " } as { id: number; name: string | null; furniture_name?: string })
    ).toBeNull();
  });

  it("groupByEmptyLabel равен 'Без мебели'", () => {
    expect(placesEntityConfig.groupByEmptyLabel).toBe("Без мебели");
  });

  it("counts задан с filterParam и links", () => {
    expect(placesEntityConfig.counts?.filterParam).toBe("placeId");
    expect(placesEntityConfig.counts?.links.length).toBeGreaterThan(0);
  });
});
