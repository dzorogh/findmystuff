import {
  insertEntityWithTransition,
  type InsertEntityWithTransitionParams,
} from "@/lib/shared/api/insert-entity-with-transition";

describe("insertEntityWithTransition", () => {
  const createSupabaseMock = (options: {
    insertResult: { data: unknown; error: unknown };
    transitionResult?: { error: unknown };
  }) => {
    const insertResult = options.insertResult;
    const transitionResult = options.transitionResult ?? { error: null };
    const deleteChain = { eq: jest.fn().mockResolvedValue(undefined) };
    const transitionInsert = jest.fn().mockResolvedValue(transitionResult);
    const createEntityTableMock = () => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(insertResult),
      delete: jest.fn().mockReturnValue(deleteChain),
      eq: deleteChain.eq,
    });
    const entityTableMocks: Record<string, ReturnType<typeof createEntityTableMock>> = {};
    const from = jest.fn((table: string) => {
      if (table === "transitions") {
        return { insert: transitionInsert };
      }
      if (!entityTableMocks[table]) {
        entityTableMocks[table] = createEntityTableMock();
      }
      return entityTableMocks[table];
    });
    return {
      from,
      _transitionInsert: transitionInsert,
      _deleteChain: deleteChain,
      _entityMocks: entityTableMocks,
    } as unknown as Parameters<typeof insertEntityWithTransition>[0]["supabase"] & {
      _transitionInsert: jest.Mock;
      _deleteChain: { eq: jest.Mock };
      _entityMocks: Record<string, { delete: jest.Mock }>;
    };
  };

  it("возвращает данные при успешном insert без transition", async () => {
    const supabase = createSupabaseMock({
      insertResult: { data: { id: 1, name: "Place" }, error: null },
    });

    const params: InsertEntityWithTransitionParams<{ id: number; name: string }> = {
      supabase,
      table: "places",
      insertData: { name: "Place", tenant_id: 1 },
      transitionPayload: null,
    };

    const result = await insertEntityWithTransition(params);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: 1, name: "Place" });
  });

  it("возвращает ошибку при ошибке insert", async () => {
    const supabase = createSupabaseMock({
      insertResult: { data: null, error: { message: "DB error" } },
    });

    const result = await insertEntityWithTransition({
      supabase,
      table: "places",
      insertData: {},
      transitionPayload: null,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe("DB error");
  });

  it("при ошибке transition откатывает insert и возвращает ошибку", async () => {
    const supabase = createSupabaseMock({
      insertResult: { data: { id: 10, name: "Box" }, error: null },
      transitionResult: { error: { message: "Transition failed" } },
    });

    const result = await insertEntityWithTransition({
      supabase,
      table: "containers",
      insertData: { name: "Box", tenant_id: 1 },
      transitionPayload: {
        destination_type: "place",
        destination_id: 5,
        tenant_id: 1,
      },
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe("Transition failed");
    expect(supabase._entityMocks["containers"].delete).toHaveBeenCalled();
    expect(supabase._deleteChain.eq).toHaveBeenCalledWith("id", 10);
  });

  it("при успешном insert и transition возвращает данные", async () => {
    const supabase = createSupabaseMock({
      insertResult: { data: { id: 2, name: "Item" }, error: null },
      transitionResult: { error: null },
    });

    const result = await insertEntityWithTransition({
      supabase,
      table: "items",
      insertData: { name: "Item", tenant_id: 1 },
      transitionPayload: {
        destination_type: "place",
        destination_id: 1,
        tenant_id: 1,
      },
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ id: 2, name: "Item" });
    expect(supabase._transitionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        item_id: 2,
        destination_type: "place",
        destination_id: 1,
        tenant_id: 1,
      })
    );
  });
});
