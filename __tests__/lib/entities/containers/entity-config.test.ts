import {
  containersEntityConfig,
  DEFAULT_CONTAINERS_FILTERS,
  type ContainersFilters,
} from "@/lib/entities/containers/entity-config";
import { getContainers } from "@/lib/containers/api";

jest.mock("@/lib/containers/api");

describe("containers entity-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("конфиг имеет обязательные поля EntityConfig", () => {
    expect(containersEntityConfig.kind).toBe("container");
    expect(containersEntityConfig.basePath).toBe("/containers");
    expect(containersEntityConfig.apiTable).toBe("containers");
    expect(containersEntityConfig.filters.initial).toEqual(DEFAULT_CONTAINERS_FILTERS);
    expect(containersEntityConfig.columns.length).toBeGreaterThan(0);
    expect(containersEntityConfig.fetch).toBeDefined();
    expect(containersEntityConfig.actions.whenActive.length).toBeGreaterThan(0);
  });

  it("filters.initial совпадает с DEFAULT_CONTAINERS_FILTERS", () => {
    expect(containersEntityConfig.filters.initial).toEqual(DEFAULT_CONTAINERS_FILTERS);
  });

  it("getName использует getEntityDisplayName (контейнер)", () => {
    const getName = containersEntityConfig.getName!;
    expect(getName({ id: 1, name: "Ящик" } as { id: number; name: string | null })).toBe("Ящик");
  });

  it("DEFAULT_CONTAINERS_FILTERS содержит ожидаемые поля", () => {
    expect(DEFAULT_CONTAINERS_FILTERS).toEqual({
      showDeleted: false,
      entityTypeId: null,
      hasItems: null,
      locationType: null,
      placeId: null,
      furnitureId: null,
    });
  });

  it("fetch без client filters возвращает data как есть", async () => {
    (getContainers as jest.Mock).mockResolvedValue({
      data: [{ id: 1, name: "Box" }],
    });

    const filters: ContainersFilters = {
      showDeleted: false,
      entityTypeId: null,
      hasItems: null,
      locationType: null,
      placeId: null,
      furnitureId: null,
    };

    const result = await containersEntityConfig.fetch!({
      filterValues: filters,
    });

    expect(result.data).toHaveLength(1);
    expect(getContainers).toHaveBeenCalled();
  });

  it("fetch с entityTypeId фильтрует по entity_type_id", async () => {
    (getContainers as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, entity_type_id: 5, itemsCount: 2 },
        { id: 2, entity_type_id: 3, itemsCount: 0 },
      ],
    });

    const filters: ContainersFilters = {
      showDeleted: false,
      entityTypeId: 5,
      hasItems: null,
      locationType: null,
      placeId: null,
      furnitureId: null,
    };

    const result = await containersEntityConfig.fetch!({
      filterValues: filters,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].entity_type_id).toBe(5);
  });

  it("fetch с hasItems: true фильтрует контейнеры без вещей", async () => {
    (getContainers as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, itemsCount: 2 },
        { id: 2, itemsCount: 0 },
      ],
    });

    const filters: ContainersFilters = {
      showDeleted: false,
      entityTypeId: null,
      hasItems: true,
      locationType: null,
      placeId: null,
      furnitureId: null,
    };

    const result = await containersEntityConfig.fetch!({
      filterValues: filters,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].itemsCount).toBe(2);
  });

  it("fetch с hasItems: false фильтрует контейнеры с вещами", async () => {
    (getContainers as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, itemsCount: 2 },
        { id: 2, itemsCount: 0 },
      ],
    });

    const filters: ContainersFilters = {
      showDeleted: false,
      entityTypeId: null,
      hasItems: false,
      locationType: null,
      placeId: null,
      furnitureId: null,
    };

    const result = await containersEntityConfig.fetch!({
      filterValues: filters,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].itemsCount).toBe(0);
  });

  it("fetch с locationType фильтрует по destination_type", async () => {
    (getContainers as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, last_location: { destination_type: "room" } },
        { id: 2, last_location: { destination_type: "place" } },
      ],
    });

    const filters: ContainersFilters = {
      showDeleted: false,
      entityTypeId: null,
      hasItems: null,
      locationType: "room",
      placeId: null,
      furnitureId: null,
    };

    const result = await containersEntityConfig.fetch!({
      filterValues: filters,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].last_location?.destination_type).toBe("room");
  });

  it("fetch с locationType all не фильтрует по location", async () => {
    (getContainers as jest.Mock).mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
    });

    const filters: ContainersFilters = {
      showDeleted: false,
      entityTypeId: null,
      hasItems: null,
      locationType: "all",
      placeId: null,
      furnitureId: null,
    };

    const result = await containersEntityConfig.fetch!({
      filterValues: filters,
    });

    expect(result.data).toHaveLength(2);
  });

  it("move включён с destinationTypes room, place, container, furniture", () => {
    expect(containersEntityConfig.move?.enabled).toBe(true);
    expect(containersEntityConfig.move?.destinationTypes).toEqual(["room", "place", "container", "furniture"]);
  });
});
