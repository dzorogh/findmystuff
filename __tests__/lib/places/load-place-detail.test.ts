import {
  loadPlaceDetail,
  type PlaceDetailData,
} from "@/lib/places/load-place-detail";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

type QueryResult<T> = { data: T; error: null } | { data: null; error: { message: string } };

const createSupabaseMock = (options: {
  placeResult: QueryResult<any>;
  transitionsResult?: QueryResult<any[]>;
}) => {
  const placeResult = options.placeResult;
  const transitionsResult =
    options.transitionsResult ?? ({ data: [], error: null } as QueryResult<any[]>);

  const result: any = {};
  result.eq = jest.fn(() => result);
  result.single = jest.fn(async () => placeResult);
  result.order = jest.fn(async () => transitionsResult);

  const select = jest.fn(() => result);
  const from = jest.fn(() => ({ select }));

  return {
    from,
    _internal: { result, select },
  };
};

describe("loadPlaceDetail", () => {
  it("возвращает 500 при ошибке выборки места", async () => {
    const supabase = createSupabaseMock({
      placeResult: { data: null, error: { message: "DB error" } },
    });

    const res = await loadPlaceDetail(supabase as any, 1);

    expect(res).toEqual({ error: "DB error", status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  });

  it("возвращает 404, если место не найдено", async () => {
    const supabase = createSupabaseMock({
      placeResult: { data: null, error: null },
    });

    const res = await loadPlaceDetail(supabase as any, 42);

    expect(res).toEqual({ error: "Место не найдено", status: HTTP_STATUS.NOT_FOUND });
  });

  it("возвращает данные места без переходов, предметов и контейнеров", async () => {
    const supabase = createSupabaseMock({
      placeResult: {
        data: {
          id: 5,
          name: "Shelf",
          entity_type_id: 3,
          entity_types: null,
          photo_url: null,
          created_at: "2024-01-01T00:00:00.000Z",
          deleted_at: null,
        },
        error: null,
      },
      transitionsResult: { data: [], error: null },
    });

    const res = await loadPlaceDetail(
      supabase as any,
      5,
    );

    expect("error" in res).toBe(false);
    const data = res as PlaceDetailData;

    expect(data.place.id).toBe(5);
    expect(data.place.name).toBe("Shelf");
    expect(data.transitions).toEqual([]);
    expect(data.items).toEqual([]);
    expect(data.containers).toEqual([]);
  });

  it("возвращает 500 при ошибке загрузки transitions", async () => {
    const supabase = createSupabaseMock({
      placeResult: {
        data: {
          id: 5,
          name: "Shelf",
          entity_type_id: 3,
          entity_types: null,
          photo_url: null,
          created_at: "2024-01-01T00:00:00.000Z",
          deleted_at: null,
        },
        error: null,
      },
      transitionsResult: { data: null, error: { message: "Transitions fetch failed" } },
    });

    const res = await loadPlaceDetail(supabase as any, 5);

    expect(res).toEqual({
      error: "Transitions fetch failed",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  });
});

