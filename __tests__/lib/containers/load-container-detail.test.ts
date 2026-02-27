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
});

