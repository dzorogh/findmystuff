import {
  itemsEntityConfig,
  DEFAULT_ITEMS_FILTERS,
  type ItemsFilters,
} from "@/lib/entities/items/entity-config";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { getItems } from "@/lib/entities/api";

jest.mock("@/lib/entities/api");

describe("items entity-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("DEFAULT_ITEMS_FILTERS содержит ожидаемые поля", () => {
    expect(DEFAULT_ITEMS_FILTERS).toEqual({
      showDeleted: false,
      locationType: null,
      hasPhoto: null,
      roomId: null,
      placeId: null,
      containerId: null,
      furnitureId: null,
    });
  });

  it("конфиг имеет обязательные поля EntityConfig", () => {
    expect(itemsEntityConfig.kind).toBe("item");
    expect(itemsEntityConfig.basePath).toBeDefined();
    expect(itemsEntityConfig.apiTable).toBe("items");
    expect(itemsEntityConfig.labels).toBeDefined();
    expect(itemsEntityConfig.filters.initial).toEqual(DEFAULT_ITEMS_FILTERS);
    expect(itemsEntityConfig.columns.length).toBeGreaterThan(0);
    expect(itemsEntityConfig.fetch).toBeDefined();
    expect(itemsEntityConfig.actions.whenActive.length).toBeGreaterThan(0);
  });

  it("itemsEntityConfig имеет корректные kind, basePath, apiTable и labels", () => {
    expect(itemsEntityConfig.kind).toBe("item");
    expect(itemsEntityConfig.basePath).toBe("/items");
    expect(itemsEntityConfig.apiTable).toBe("items");
    expect(itemsEntityConfig.labels.plural).toBe("Вещи");
    expect(itemsEntityConfig.labels.singular).toBe("Вещь");
    expect(itemsEntityConfig.labels.results).toEqual({ one: "вещь", few: "вещи", many: "вещей" });
  });

  it("filters.initial совпадает с DEFAULT_ITEMS_FILTERS", () => {
    expect(itemsEntityConfig.filters.initial).toEqual(DEFAULT_ITEMS_FILTERS);
  });

  it("columns не пустой и содержит ключевые колонки", () => {
    expect(itemsEntityConfig.columns.length).toBeGreaterThan(0);
    const keys = itemsEntityConfig.columns.map((c) => c.key);
    expect(keys).toContain("id");
    expect(keys).toContain("name");
    expect(keys).toContain("actions");
  });

  it("отображаемое имя по умолчанию (getEntityDisplayName): name если не пустой", () => {
    expect(getEntityDisplayName("item", 1, "Книга")).toBe("Книга");
  });

  it("отображаемое имя по умолчанию: 'Вещь #id' если name пустой", () => {
    expect(getEntityDisplayName("item", 5, null)).toBe("Вещь #5");
    expect(getEntityDisplayName("item", 5, "")).toBe("Вещь #5");
    expect(getEntityDisplayName("item", 5, "   ")).toBe("Вещь #5");
  });

  it("fetch вызывает getItems и возвращает data и totalCount", async () => {
    (getItems as jest.Mock).mockResolvedValue({
      data: [{ id: 1, name: "Item" }],
      totalCount: 1,
    });

    const filters: ItemsFilters = {
      showDeleted: false,
      locationType: null,
      hasPhoto: null,
      roomId: null,
      placeId: null,
      containerId: null,
      furnitureId: null,
    };

    const result = await itemsEntityConfig.fetch({
      query: "test",
      filterValues: filters,
      sortBy: "name",
      sortDirection: "asc",
      page: 1,
    });

    expect(result).toEqual({ data: [{ id: 1, name: "Item" }], totalCount: 1 });
    expect(getItems).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "test",
        showDeleted: false,
        sortBy: "name",
        sortDirection: "asc",
        page: 1,
      })
    );
  });

  it("fetch передаёт locationType, roomId, placeId, containerId, furnitureId, hasPhoto в getItems", async () => {
    (getItems as jest.Mock).mockResolvedValue({ data: [], totalCount: 0 });

    await itemsEntityConfig.fetch({
      filterValues: {
        showDeleted: false,
        locationType: "furniture",
        hasPhoto: true,
        roomId: 1,
        placeId: 2,
        containerId: 3,
        furnitureId: 5,
      } as ItemsFilters,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(getItems).toHaveBeenCalledWith(
      expect.objectContaining({
        locationType: "furniture",
        hasPhoto: true,
        roomId: 1,
        placeId: 2,
        containerId: 3,
        furnitureId: 5,
      })
    );
  });

  it("fetch при не-массиве response.data возвращает пустой массив", async () => {
    (getItems as jest.Mock).mockResolvedValue({ data: null, totalCount: 0 });

    const result = await itemsEntityConfig.fetch({
      filterValues: DEFAULT_ITEMS_FILTERS,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("pagination задан с pageSize 20", () => {
    expect(itemsEntityConfig.pagination).toEqual({ pageSize: 20 });
  });

  it("move включён с destinationTypes room, place, container, furniture", () => {
    expect(itemsEntityConfig.move?.enabled).toBe(true);
    expect(itemsEntityConfig.move?.destinationTypes).toEqual(["room", "place", "container", "furniture"]);
  });
});
