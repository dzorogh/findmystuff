import { loadRoomDetail, type RoomDetailData } from "@/lib/rooms/load-room-detail";

const createRoomsBuilder = (roomResult: { data: any; error: any }) => {
  const builder: any = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.is = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.order = jest.fn(async () => ({ data: [], error: null }));
  builder.single = jest.fn(async () => roomResult);
  return builder;
};

const createGenericBuilder = () => {
  const builder: any = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.is = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.order = jest.fn(async () => ({ data: [], error: null }));
  return builder;
};

const createSupabaseMock = (roomResult: { data: any; error: any }) => {
  const roomsBuilder = createRoomsBuilder(roomResult);
  const genericBuilder = createGenericBuilder();

  return {
    from: jest.fn((table: string) => {
      if (table === "rooms") {
        return roomsBuilder;
      }
      return genericBuilder;
    }),
  };
};

jest.mock("@/lib/rooms/api", () => ({
  getItemIdsInRoomRpc: jest.fn(async () => ({ data: [] })),
}));

const { getItemIdsInRoomRpc } = jest.requireMock("@/lib/rooms/api") as {
  getItemIdsInRoomRpc: jest.Mock;
};

type SupabaseResult<T> = { data: T; error: any };

const createResultBuilder = (result: SupabaseResult<any>) => {
  const builder: any = {};
  builder.data = result.data;
  builder.error = result.error;
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.is = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.order = jest.fn(async () => result);
  builder.single = jest.fn(async () => result);
  return builder;
};

const createSupabaseSuccessMock = () => {
  const roomResult: SupabaseResult<any> = {
    data: {
      id: 1,
      name: "Room A",
      photo_url: "https://example.com/room.jpg",
      created_at: "2024-01-01T00:00:00.000Z",
      deleted_at: null,
      room_type_id: 7,
      building_id: 2,
      entity_types: null,
      buildings: [{ name: "Main building" }],
    },
    error: null,
  };

  const transitionsResult: SupabaseResult<any[]> = {
    data: [
      {
        place_id: null,
        container_id: 10,
        destination_type: "room",
        destination_id: 1,
        created_at: "2024-01-02T00:00:00.000Z",
      },
    ],
    error: null,
  };

  const placesInRoomMvResult: SupabaseResult<any[]> = {
    data: [{ place_id: 100 }],
    error: null,
  };

  const furnitureResult: SupabaseResult<any[]> = {
    data: [
      {
        id: 50,
        name: "Shelf",
        photo_url: null,
        created_at: "2024-01-03T00:00:00.000Z",
        deleted_at: null,
        room_id: 1,
        furniture_type_id: 3,
      },
    ],
    error: null,
  };

  const itemsResult: SupabaseResult<any[]> = {
    data: [
      {
        id: 1,
        name: "Item 1",
        photo_url: null,
        created_at: "2024-01-04T00:00:00.000Z",
        deleted_at: null,
      },
    ],
    error: null,
  };

  const placesResult: SupabaseResult<any[]> = {
    data: [
      {
        id: 100,
        name: "Place 1",
        photo_url: null,
        created_at: "2024-01-05T00:00:00.000Z",
        deleted_at: null,
        entity_type_id: null,
      },
    ],
    error: null,
  };

  const containersResult: SupabaseResult<any[]> = {
    data: [
      {
        id: 10,
        name: "Container 10",
        photo_url: null,
        created_at: "2024-01-06T00:00:00.000Z",
        deleted_at: null,
        entity_type_id: null,
      },
    ],
    error: null,
  };

  const roomsBuilder = createResultBuilder(roomResult);
  const transitionsBuilder = createResultBuilder(transitionsResult);
  const placesInRoomBuilder = createResultBuilder(placesInRoomMvResult);
  const furnitureBuilder = createResultBuilder(furnitureResult);
  const itemsBuilder = createResultBuilder(itemsResult);
  const placesBuilder = createResultBuilder(placesResult);
  const containersBuilder = createResultBuilder(containersResult);

  const from = jest.fn((table: string) => {
    switch (table) {
      case "rooms":
        return roomsBuilder;
      case "transitions":
        return transitionsBuilder;
      case "v_place_last_room_transition":
        return placesInRoomBuilder;
      case "furniture":
        return furnitureBuilder;
      case "items":
        return itemsBuilder;
      case "places":
        return placesBuilder;
      case "containers":
        return containersBuilder;
      default:
        throw new Error(`Unexpected table: ${table}`);
    }
  });

  return { supabase: { from } as any };
};

describe("loadRoomDetail", () => {
  it("возвращает 500 при ошибке выборки комнаты", async () => {
    const supabase = createSupabaseMock({
      data: null,
      error: { message: "DB error" },
    });

    const res = await loadRoomDetail(supabase as any, 1);

    expect(res).toEqual({ error: "DB error", status: 500 });
  });

  it("возвращает 404, если комната не найдена", async () => {
    const supabase = createSupabaseMock({
      data: null,
      error: null,
    });

    const res = await loadRoomDetail(supabase as any, 42);

    expect(res).toEqual({ error: "Помещение не найдено", status: 404 });
  });

  it("возвращает детали комнаты с вещами, местами, контейнерами и мебелью", async () => {
    getItemIdsInRoomRpc.mockResolvedValueOnce({
      data: [{ item_id: 1 }],
    });

    const { supabase } = createSupabaseSuccessMock();
    const res = await loadRoomDetail(supabase, 1);

    expect("error" in res).toBe(false);
    const data = res as RoomDetailData;

    expect(data.room.id).toBe(1);
    expect(data.items).toHaveLength(1);
    expect(data.places).toHaveLength(1);
    expect(data.containers).toHaveLength(1);
    expect(data.furniture).toHaveLength(1);
  });
});

