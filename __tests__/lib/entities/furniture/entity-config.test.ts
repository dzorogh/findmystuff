import {
  furnitureEntityConfig,
  DEFAULT_FURNITURE_FILTERS,
  type FurnitureFilters,
} from "@/lib/entities/furniture/entity-config";
import { getFurniture } from "@/lib/furniture/api";

jest.mock("@/lib/furniture/api");

describe("furniture entity-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("конфиг имеет обязательные поля EntityConfig", () => {
    expect(furnitureEntityConfig.kind).toBe("furniture");
    expect(furnitureEntityConfig.basePath).toBe("/furniture");
    expect(furnitureEntityConfig.apiTable).toBe("furniture");
    expect(furnitureEntityConfig.filters.initial).toEqual(DEFAULT_FURNITURE_FILTERS);
    expect(furnitureEntityConfig.columns.length).toBeGreaterThan(0);
    expect(furnitureEntityConfig.fetch).toBeDefined();
    expect(furnitureEntityConfig.actions.whenActive.length).toBeGreaterThan(0);
  });

  it("filters.initial совпадает с DEFAULT_FURNITURE_FILTERS", () => {
    expect(furnitureEntityConfig.filters.initial).toEqual(DEFAULT_FURNITURE_FILTERS);
  });

  it("groupBy возвращает room.name если не пустой", () => {
    const groupBy = furnitureEntityConfig.groupBy!;
    expect(
      groupBy({
        id: 1,
        name: "X",
        room: { id: 10, name: "Кухня" },
      } as { id: number; name: string | null; room?: { id: number; name: string | null } })
    ).toBe("Кухня");
  });

  it("groupBy возвращает null если room_name пустой", () => {
    const groupBy = furnitureEntityConfig.groupBy!;
    expect(
      groupBy({ id: 1, name: "X" } as { id: number; name: string | null; room_name?: string })
    ).toBeNull();
  });

  it("groupByEmptyLabel равен 'Без помещения'", () => {
    expect(furnitureEntityConfig.groupByEmptyLabel).toBe("Без помещения");
  });

  it("counts задан с filterParam furnitureId и ссылкой на places", () => {
    expect(furnitureEntityConfig.counts?.filterParam).toBe("furnitureId");
    expect(furnitureEntityConfig.counts?.links).toContainEqual(
      expect.objectContaining({ path: "/places", field: "places_count" })
    );
  });

  it("DEFAULT_FURNITURE_FILTERS содержит showDeleted и roomId", () => {
    expect(DEFAULT_FURNITURE_FILTERS).toEqual({ showDeleted: false, roomId: null });
  });

  it("furnitureEntityConfig имеет корректные labels", () => {
    expect(furnitureEntityConfig.basePath).toBe("/furniture");
    expect(furnitureEntityConfig.labels.plural).toBe("Мебель");
    expect(furnitureEntityConfig.labels.singular).toBe("Мебель");
  });

  it("getName возвращает name если не пустой", () => {
    const getName = furnitureEntityConfig.getName!;
    expect(getName({ id: 1, name: "Стол" } as { id: number; name: string | null })).toBe("Стол");
  });

  it("getName возвращает 'Мебель #id' если name пустой", () => {
    const getName = furnitureEntityConfig.getName!;
    expect(getName({ id: 3, name: null } as { id: number; name: string | null })).toBe("Мебель #3");
  });

  it("fetch вызывает getFurniture с roomId", async () => {
    (getFurniture as jest.Mock).mockResolvedValue({
      data: [{ id: 1 }],
      totalCount: 1,
    });

    const filters: FurnitureFilters = { showDeleted: false, roomId: 5 };
    await furnitureEntityConfig.fetch!({
      filterValues: filters,
    });

    expect(getFurniture).toHaveBeenCalledWith(
      expect.objectContaining({ roomId: 5, showDeleted: false })
    );
  });

  it("fetch обрабатывает roomId null", async () => {
    (getFurniture as jest.Mock).mockResolvedValue({ data: [] });

    await furnitureEntityConfig.fetch!({
      filterValues: { showDeleted: false, roomId: null },
    });

    expect(getFurniture).toHaveBeenCalledWith(
      expect.objectContaining({ showDeleted: false })
    );
  });
});
