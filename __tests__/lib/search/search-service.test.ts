import {
  searchHomeEntitiesByImage,
  searchHomeEntitiesByText,
} from "@/lib/search/search-service";

const mockSearchEntitiesByEmbeddingRpc = jest.fn();
const mockGetItemSearchProjectionByIds = jest.fn();
const mockGetContainerSearchProjectionByIds = jest.fn();
const mockSearchItemsByNameProjection = jest.fn();
const mockSearchContainersByNameProjection = jest.fn();
const mockEmbedSearchText = jest.fn();
const mockEmbedSearchImage = jest.fn();
const mockIsSearchMultimodalConfigured = jest.fn();
const mockLogError = jest.fn();

jest.mock("@/lib/entities/api", () => ({
  searchEntitiesByEmbeddingRpc: (...args: unknown[]) =>
    mockSearchEntitiesByEmbeddingRpc(...args),
}));

jest.mock("@/lib/entities/items/search-projection-server", () => ({
  getItemSearchProjectionByIds: (...args: unknown[]) =>
    mockGetItemSearchProjectionByIds(...args),
  getContainerSearchProjectionByIds: (...args: unknown[]) =>
    mockGetContainerSearchProjectionByIds(...args),
  searchItemsByNameProjection: (...args: unknown[]) =>
    mockSearchItemsByNameProjection(...args),
  searchContainersByNameProjection: (...args: unknown[]) =>
    mockSearchContainersByNameProjection(...args),
}));

jest.mock("@/lib/shared/api/item-multimodal-embeddings-server", () => ({
  embedSearchText: (...args: unknown[]) => mockEmbedSearchText(...args),
  embedSearchImage: (...args: unknown[]) => mockEmbedSearchImage(...args),
  isSearchMultimodalConfigured: () => mockIsSearchMultimodalConfigured(),
}));

jest.mock("@/lib/shared/logger", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

describe("searchHomeEntities*", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("в fallback по тексту возвращает только вещи и контейнеры", async () => {
    mockIsSearchMultimodalConfigured.mockReturnValue(false);
    mockSearchItemsByNameProjection.mockResolvedValue([
      {
        id: 1,
        name: "Утюг",
        photo_url: null,
        item_type_name: "Техника",
        room_name: null,
        furniture_name: null,
        place_name: null,
        container_name: null,
      },
    ]);
    mockSearchContainersByNameProjection.mockResolvedValue([
      {
        id: 2,
        name: "Коробка для утюга",
        photo_url: null,
        container_type_name: "Коробка",
        room_name: null,
        furniture_name: null,
        place_name: null,
        container_name: null,
      },
    ]);

    const result = await searchHomeEntitiesByText({} as never, 1, "утюг");

    expect(result.data.map((hit) => hit.entityType)).toEqual(["item", "container"]);
    expect(result.totalCount).toBe(2);
    expect(mockSearchItemsByNameProjection).toHaveBeenCalled();
    expect(mockSearchContainersByNameProjection).toHaveBeenCalled();
  });

  it("по фото возвращает смешанную semantic выдачу вещей и контейнеров", async () => {
    mockEmbedSearchImage.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      model: "test-model",
    });
    mockSearchEntitiesByEmbeddingRpc.mockResolvedValue({
      data: [
        {
          entity_type: "container",
          entity_id: 2,
          similarity: 0.87,
          match_source: "image",
          total_count: 2,
        },
        {
          entity_type: "item",
          entity_id: 1,
          similarity: 0.74,
          match_source: "image",
          total_count: 2,
        },
      ],
      error: null,
    });
    mockGetContainerSearchProjectionByIds.mockResolvedValue([
      {
        id: 2,
        name: "Красный контейнер",
        photo_url: "https://example.com/container.jpg",
        container_type_name: "Контейнер",
        room_name: "Кладовая",
        furniture_name: null,
        place_name: null,
        container_name: null,
      },
    ]);
    mockGetItemSearchProjectionByIds.mockResolvedValue([
      {
        id: 1,
        name: "Красный чайник",
        photo_url: "https://example.com/item.jpg",
        item_type_name: "Техника",
        room_name: "Кухня",
        furniture_name: null,
        place_name: null,
        container_name: null,
      },
    ]);

    const result = await searchHomeEntitiesByImage({} as never, 1, {
      buffer: Buffer.from("image"),
      mimeType: "image/jpeg",
    });

    expect(result.data.map((hit) => hit.entityType)).toEqual(["container", "item"]);
    expect(result.totalCount).toBe(2);
    expect(mockSearchEntitiesByEmbeddingRpc).toHaveBeenCalled();
  });
});
