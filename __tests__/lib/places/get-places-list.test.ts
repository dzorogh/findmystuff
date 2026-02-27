import {
  getPlacesList,
  mapRpcPlaceToPlace,
  type GetPlacesListParams,
  type RpcPlaceRow,
} from "@/lib/places/get-places-list";
import * as placesApi from "@/lib/places/api";

jest.mock("@/lib/places/api", () => ({
  getPlacesWithRoomRpc: jest.fn(),
}));

const getPlacesWithRoomRpc = placesApi.getPlacesWithRoomRpc as jest.MockedFunction<
  typeof placesApi.getPlacesWithRoomRpc
>;

const defaultParams: GetPlacesListParams = {
  query: null,
  showDeleted: false,
  sortBy: "name",
  sortDirection: "asc",
  entityTypeId: null,
  roomId: null,
  furnitureId: null,
  tenantId: 1,
};

/** Цепочка Supabase-подобного запроса, при await возвращает переданный результат. */
const createSupabaseChainMock = (result: { data: unknown; error: unknown }) => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    order: () => chain,
    limit: () => chain,
    is: () => chain,
    not: () => chain,
    eq: () => chain,
    in: () => chain,
    then: (resolve: (v: unknown) => void) => {
      resolve(result);
      return Promise.resolve();
    },
  };
  return {
    from: () => chain,
  };
};

describe("getPlacesList", () => {
  const supabase = {} as Parameters<typeof getPlacesList>[0];

  beforeEach(() => {
    getPlacesWithRoomRpc.mockReset();
  });

  it("возвращает список мест при успешном RPC", async () => {
    const rpcRow: RpcPlaceRow = {
      id: 1,
      name: "Полка",
      entity_type_id: 2,
      entity_type_name: "Стеллаж",
      created_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
      photo_url: null,
      room_id: 10,
      room_name: "Гостиная",
      furniture_id: 5,
      furniture_name: "Шкаф",
      items_count: 3,
      containers_count: 1,
    };
    getPlacesWithRoomRpc.mockResolvedValue({
      data: [rpcRow],
      error: null,
    });

    const result = await getPlacesList(supabase, defaultParams);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]).toMatchObject({
      id: 1,
      name: "Полка",
      entity_type_id: 2,
      entity_type: { name: "Стеллаж" },
      room_id: 10,
      room_name: "Гостиная",
      furniture_id: 5,
      furniture_name: "Шкаф",
      items_count: 3,
      containers_count: 1,
    });
    expect(result.data?.[0].room).toEqual({ id: 10, name: "Гостиная" });
  });

  it("возвращает пустой массив при успешном RPC без данных", async () => {
    getPlacesWithRoomRpc.mockResolvedValue({ data: [], error: null });

    const result = await getPlacesList(supabase, defaultParams);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("возвращает null и сообщение при ошибке RPC (не code column)", async () => {
    getPlacesWithRoomRpc.mockResolvedValue({
      data: null,
      error: { message: "Connection failed" },
    });

    const result = await getPlacesList(supabase, defaultParams);

    expect(result.data).toBeNull();
    expect(result.error).toBe("Connection failed");
  });

  it("при ошибке «column code does not exist» переходит на fallback и возвращает результат fallback", async () => {
    getPlacesWithRoomRpc.mockResolvedValue({
      data: null,
      error: {
        message: 'column "code" does not exist',
      },
    });

    const supabaseFallback = createSupabaseChainMock({
      data: [],
      error: null,
    }) as Parameters<typeof getPlacesList>[0];

    const result = await getPlacesList(supabaseFallback, defaultParams);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

});

describe("mapRpcPlaceToPlace", () => {
  it("маппирует RpcPlaceRow в Place с полными полями", () => {
    const row: RpcPlaceRow = {
      id: 1,
      name: "Полка",
      entity_type_id: 2,
      entity_type_name: "Стеллаж",
      created_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
      photo_url: "https://example.com/photo.jpg",
      room_id: 10,
      room_name: "Гостиная",
      furniture_id: 5,
      furniture_name: "Шкаф",
      items_count: 3,
      containers_count: 1,
    };

    const place = mapRpcPlaceToPlace(row);

    expect(place).toEqual({
      id: 1,
      name: "Полка",
      entity_type_id: 2,
      entity_type: { name: "Стеллаж" },
      created_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
      photo_url: "https://example.com/photo.jpg",
      room_id: 10,
      room_name: "Гостиная",
      furniture_id: 5,
      furniture_name: "Шкаф",
      room: { id: 10, name: "Гостиная" },
      items_count: 3,
      containers_count: 1,
    });
  });

  it("обрабатывает null/отсутствующие поля", () => {
    const row: RpcPlaceRow = {
      id: 2,
      name: null,
      entity_type_id: null,
      entity_type_name: null,
      created_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
      photo_url: null,
      room_id: null,
      room_name: null,
      furniture_id: null,
      furniture_name: null,
      items_count: 0,
      containers_count: 0,
    };

    const place = mapRpcPlaceToPlace(row);

    expect(place.name).toBeNull();
    expect(place.entity_type_id).toBeNull();
    expect(place.entity_type).toBeNull();
    expect(place.room_id).toBeNull();
    expect(place.room_name).toBeNull();
    expect(place.furniture_id).toBeNull();
    expect(place.furniture_name).toBeNull();
    expect(place.room).toBeNull();
    expect(place.items_count).toBe(0);
    expect(place.containers_count).toBe(0);
  });
});
