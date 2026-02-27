import {
  roomsEntityConfig,
  DEFAULT_ROOMS_FILTERS,
  type RoomsFilters,
} from "@/lib/entities/rooms/entity-config";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { getRooms } from "@/lib/rooms/api";

jest.mock("@/lib/rooms/api");

describe("rooms entity-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("DEFAULT_ROOMS_FILTERS содержит ожидаемые поля", () => {
    expect(DEFAULT_ROOMS_FILTERS).toEqual({
      showDeleted: false,
      hasItems: null,
      hasContainers: null,
      hasPlaces: null,
      buildingId: null,
    });
  });

  it("конфиг имеет обязательные поля EntityConfig", () => {
    expect(roomsEntityConfig.kind).toBe("room");
    expect(roomsEntityConfig.basePath).toBeDefined();
    expect(roomsEntityConfig.apiTable).toBe("rooms");
    expect(roomsEntityConfig.labels).toBeDefined();
    expect(roomsEntityConfig.filters.initial).toEqual(DEFAULT_ROOMS_FILTERS);
    expect(roomsEntityConfig.columns.length).toBeGreaterThan(0);
    expect(roomsEntityConfig.fetch).toBeDefined();
    expect(roomsEntityConfig.actions.whenActive.length).toBeGreaterThan(0);
  });

  it("roomsEntityConfig имеет корректные kind, basePath, apiTable и labels", () => {
    expect(roomsEntityConfig.kind).toBe("room");
    expect(roomsEntityConfig.basePath).toBe("/rooms");
    expect(roomsEntityConfig.apiTable).toBe("rooms");
    expect(roomsEntityConfig.labels.plural).toBe("Помещения");
    expect(roomsEntityConfig.labels.singular).toBe("Помещение");
    expect(roomsEntityConfig.labels.results).toEqual({
      one: "помещение",
      few: "помещения",
      many: "помещений",
    });
  });

  it("filters.initial совпадает с DEFAULT_ROOMS_FILTERS", () => {
    expect(roomsEntityConfig.filters.initial).toEqual(DEFAULT_ROOMS_FILTERS);
  });

  it("columns не пустой и содержит ключевые колонки", () => {
    expect(roomsEntityConfig.columns.length).toBeGreaterThan(0);
    const keys = roomsEntityConfig.columns.map((c) => c.key);
    expect(keys).toContain("id");
    expect(keys).toContain("name");
    expect(keys).toContain("actions");
  });

  it("отображаемое имя по умолчанию (getEntityDisplayName): name если не пустой", () => {
    expect(getEntityDisplayName("room", 1, "Кухня")).toBe("Кухня");
  });

  it("отображаемое имя по умолчанию: 'Помещение #id' если name пустой", () => {
    expect(getEntityDisplayName("room", 2, null)).toBe("Помещение #2");
    expect(getEntityDisplayName("room", 2, "")).toBe("Помещение #2");
  });

  it("fetch вызывает getRooms и возвращает data и totalCount", async () => {
    (getRooms as jest.Mock).mockResolvedValue({
      data: [{ id: 1, name: "Room" }],
      totalCount: 1,
    });

    const filters: RoomsFilters = {
      showDeleted: false,
      hasItems: null,
      hasContainers: null,
      hasPlaces: null,
      buildingId: null,
    };

    const result = await roomsEntityConfig.fetch({
      query: "test",
      filterValues: filters,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(getRooms).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "test",
        showDeleted: false,
        sortBy: "name",
        sortDirection: "asc",
      })
    );
  });

  it("fetch передаёт hasItems, hasContainers, hasPlaces, buildingId в getRooms", async () => {
    (getRooms as jest.Mock).mockResolvedValue({ data: [], totalCount: 0 });

    await roomsEntityConfig.fetch({
      filterValues: {
        showDeleted: false,
        hasItems: true,
        hasContainers: false,
        hasPlaces: null,
        buildingId: 10,
      } as RoomsFilters,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(getRooms).toHaveBeenCalledWith(
      expect.objectContaining({
        hasItems: true,
        hasContainers: false,
        hasPlaces: undefined,
        buildingId: 10,
      })
    );
  });

  it("fetch при отсутствии totalCount использует list.length", async () => {
    (getRooms as jest.Mock).mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
    });

    const result = await roomsEntityConfig.fetch({
      filterValues: DEFAULT_ROOMS_FILTERS,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toHaveLength(2);
    expect(result.totalCount).toBe(2);
  });

  it("fetch при не-массиве response.data возвращает пустой массив", async () => {
    (getRooms as jest.Mock).mockResolvedValue({ data: null });

    const result = await roomsEntityConfig.fetch({
      filterValues: DEFAULT_ROOMS_FILTERS,
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("defaultSort задан name asc", () => {
    expect(roomsEntityConfig.defaultSort).toEqual({ sortBy: "name", sortDirection: "asc" });
  });

  it("groupBy возвращает building_name если не пустой", () => {
    const groupBy = roomsEntityConfig.groupBy!;
    expect(
      groupBy({
        id: 1,
        name: "X",
        building_name: "Корпус А",
      } as { id: number; name: string | null; building_name?: string })
    ).toBe("Корпус А");
  });

  it("groupBy возвращает null если building_name пустой", () => {
    const groupBy = roomsEntityConfig.groupBy!;
    expect(
      groupBy({ id: 1, name: "X" } as { id: number; name: string | null; building_name?: string })
    ).toBeNull();
    expect(
      groupBy({
        id: 1,
        name: "X",
        building_name: "",
      } as { id: number; name: string | null; building_name?: string })
    ).toBeNull();
  });

  it("counts задан с filterParam и links", () => {
    expect(roomsEntityConfig.counts?.filterParam).toBe("roomId");
    expect(roomsEntityConfig.counts?.links.length).toBeGreaterThan(0);
  });
});
