import {
  loadContainerDetail,
  type ContainerDetailData,
} from "@/lib/containers/load-container-detail";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

type QueryResult<T> = { data: T; error: null } | { data: null; error: { message: string } };

const createSupabaseMock = (options: {
  containerResult: QueryResult<any>;
  transitionsResult?: QueryResult<any[]>;
}) => {
  const containerResult = options.containerResult;
  const transitionsResult =
    options.transitionsResult ?? ({ data: [], error: null } as QueryResult<any[]>);

  const result: any = {};
  result.eq = jest.fn(() => result);
  result.single = jest.fn(async () => containerResult);
  result.order = jest.fn(async () => transitionsResult);

  const select = jest.fn(() => result);
  const from = jest.fn(() => ({ select }));

  return {
    from,
    _internal: { result, select },
  };
};

/** Мок с очередью ответов по таблицам для сценариев с переходами и last_location. */
const createTableAwareSupabaseMock = (responses: {
  containers: Array<QueryResult<any>>;
  transitions: Array<QueryResult<any[]>>;
  places?: Array<QueryResult<any[]>>;
  rooms?: Array<QueryResult<any[]>>;
  furniture?: Array<QueryResult<any[]>>;
  items?: Array<QueryResult<any[]>>;
}) => {
  const queues: Record<string, any[]> = {
    containers: [...responses.containers],
    transitions: [...responses.transitions],
    places: responses.places ?? [],
    rooms: responses.rooms ?? [],
    furniture: responses.furniture ?? [],
    items: responses.items ?? [],
  };

  const pop = (table: string): any => {
    const q = queues[table];
    if (!q || q.length === 0) return { data: [], error: null };
    return q.shift();
  };

  const builder = (table: string): any => {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      is: () => chain,
      order: () => chain,
      single: () => Promise.resolve(pop(table)),
      then: (resolve: (v: any) => void) => {
        const result = pop(table);
        resolve(result);
        return Promise.resolve();
      },
      catch: (fn: (e: any) => void) => Promise.resolve().catch(fn),
    };
    chain.order = () => Promise.resolve(pop(table));
    return chain;
  };

  return {
    from: jest.fn((table: string) => builder(table)),
  };
};

describe("loadContainerDetail", () => {
  it("возвращает 500 при ошибке выборки контейнера", async () => {
    const supabase = createSupabaseMock({
      containerResult: { data: null, error: { message: "DB error" } },
    });

    const res = await loadContainerDetail(supabase as any, 1);

    expect(res).toEqual({ error: "DB error", status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  });

  it("возвращает 404, если контейнер не найден", async () => {
    const supabase = createSupabaseMock({
      containerResult: { data: null, error: null },
    });

    const res = await loadContainerDetail(supabase as any, 42);

    expect(res).toEqual({ error: "Контейнер не найден", status: HTTP_STATUS.NOT_FOUND });
  });

  it("возвращает 500 при ошибке загрузки переходов", async () => {
    const supabase = createTableAwareSupabaseMock({
      containers: [
        {
          data: {
            id: 1,
            name: "Box",
            entity_type_id: null,
            entity_types: null,
            photo_url: null,
            created_at: "2024-01-01T00:00:00.000Z",
            deleted_at: null,
          },
          error: null,
        },
      ],
      transitions: [{ data: null, error: { message: "Transitions error" } }],
    });

    const res = await loadContainerDetail(supabase as any, 1);

    expect(res).toEqual({
      error: "Transitions error",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  });

  it("возвращает данные контейнера без переходов и предметов", async () => {
    const supabase = createSupabaseMock({
      containerResult: {
        data: {
          id: 10,
          name: "Box",
          entity_type_id: 5,
          entity_types: null,
          photo_url: "https://example.com/photo.jpg",
          created_at: "2024-01-01T00:00:00.000Z",
          deleted_at: null,
        },
        error: null,
      },
      transitionsResult: { data: [], error: null },
    });

    const res = await loadContainerDetail(
      supabase as any,
      10,
    );

    expect("error" in res).toBe(false);
    const data = res as ContainerDetailData;

    expect(data.container.id).toBe(10);
    expect(data.container.name).toBe("Box");
    expect(data.transitions).toEqual([]);
    expect(data.items).toEqual([]);
  });

  it("возвращает контейнер с переходами и маппингом last_location (place + room)", async () => {
    const containerId = 10;
    const supabase = createTableAwareSupabaseMock({
      containers: [
        {
          data: {
            id: containerId,
            name: "Box",
            entity_type_id: null,
            entity_types: null,
            photo_url: null,
            created_at: "2024-01-01T00:00:00.000Z",
            deleted_at: null,
          },
          error: null,
        },
      ],
      transitions: [
        {
          data: [
            {
              id: 1,
              created_at: "2024-01-02T12:00:00.000Z",
              destination_type: "place",
              destination_id: 100,
            },
          ],
          error: null,
        },
        {
          data: [
            { place_id: 100, destination_id: 200 },
          ],
          error: null,
        },
        { data: [], error: null },
      ],
      places: [{ data: [{ id: 100, name: "Place A" }], error: null }],
      rooms: [{ data: [{ id: 200, name: "Room B" }], error: null }],
      furniture: [{ data: [], error: null }],
      items: [],
    });

    const res = await loadContainerDetail(supabase as any, containerId);

    expect("error" in res).toBe(false);
    const data = res as ContainerDetailData;

    expect(data.container.id).toBe(containerId);
    expect(data.container.last_location).not.toBeNull();
    expect(data.container.last_location?.destination_type).toBe("place");
    expect(data.container.last_location?.destination_id).toBe(100);
    expect(data.container.last_location?.destination_name).toBe("Place A");
    expect(data.container.last_location?.moved_at).toBe("2024-01-02T12:00:00.000Z");

    expect(data.transitions).toHaveLength(1);
    expect(data.transitions[0].destination_name).toBe("Place A");
    expect(data.transitions[0].room_name).toBe("Room B");
    expect(data.items).toEqual([]);
  });

  it("возвращает данные со всеми типами переходов и предметами внутри контейнера", async () => {
    const containerId = 10;
    const supabase = createTableAwareSupabaseMock({
      containers: [
        {
          data: {
            id: containerId,
            name: "Master Container",
            entity_type_id: null,
            entity_types: null,
            photo_url: null,
            created_at: "2024-01-01T00:00:00.000Z",
            deleted_at: null,
          },
          error: null,
        },
        // Call for containerIds
        { data: [{ id: 66, name: "Sub Container" }], error: null }
      ],
      transitions: [
        // 1. Initial transitions for the container itself
        {
          data: [
            { id: 1, created_at: "2024-01-02", destination_type: "furniture", destination_id: 200 },
            { id: 2, created_at: "2024-01-01", destination_type: "container", destination_id: 66 },
            { id: 3, created_at: "2023-12-31", destination_type: "room", destination_id: 300 },
            { id: 4, created_at: "2023-12-30", destination_type: "place", destination_id: 400 }
          ],
          error: null
        },
        // 2. placesTransitionsData
        { data: [{ place_id: 400, destination_id: 300 }], error: null },
        // 3. itemsTransitionsData
        { data: [{ item_id: 888 }, { item_id: 999 }, { item_id: null }], error: null },
        // 4. allItemTransitionsData
        { 
          data: [
            { item_id: 888, destination_type: "container", destination_id: containerId, created_at: "2024-02-01" },
            { item_id: 999, destination_type: "place", destination_id: 111, created_at: "2024-02-02" } // Moved out
          ],
          error: null
        }
      ],
      places: [
        { data: [{ id: 400, name: "Storage unit" }], error: null }
      ],
      furniture: [
        { data: [{ id: 200, name: "Desk", room_id: 300 }], error: null }
      ],
      rooms: [
        { data: [{ id: 300, name: "Office" }], error: null },
        { data: [{ id: 300, name: "Office" }], error: null }, // placeRoomsData or furnitureRoomsData
        { data: [{ id: 300, name: "Office" }], error: null }
      ],
      items: [
        { data: [{ id: 888, name: "Pencil", photo_url: null, created_at: "2024-02-01", deleted_at: null }], error: null }
      ]
    });

    const res = await loadContainerDetail(supabase as any, containerId);

    expect("error" in res).toBe(false);
    const data = res as ContainerDetailData;

    expect(data.container.id).toBe(containerId);
    expect(data.container.last_location?.destination_type).toBe("furniture");

    expect(data.transitions).toHaveLength(4);
    expect(data.transitions[0].destination_name).toBe("Desk");
    expect(data.transitions[0].room_name).toBe("Office");

    expect(data.transitions[1].destination_name).toBe("Sub Container");
    expect(data.transitions[2].destination_name).toBe("Office");
    expect(data.transitions[3].destination_name).toBe("Storage unit");
    expect(data.transitions[3].room_name).toBe("Office");

    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe(888);
  });
});
