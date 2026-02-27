import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type EntityType,
  getEntityNameForMetadata,
  generateEntityDetailMetadata,
} from "@/lib/entities/server-metadata";

jest.mock("@/lib/users/server", () => ({
  getServerUser: jest.fn(),
}));

jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn(),
}));

const { getServerUser } = jest.requireMock("@/lib/users/server") as {
  getServerUser: jest.Mock;
};
const { createClient } = jest.requireMock(
  "@/lib/shared/supabase/server"
) as { createClient: jest.Mock };

describe("getEntityNameForMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает fallback, если пользователь не авторизован", async () => {
    getServerUser.mockResolvedValue(null);

    const name = await getEntityNameForMetadata("item", 1);

    expect(name).toBe("Вещь");
    expect(createClient).not.toHaveBeenCalled();
  });

  const types: EntityType[] = [
    "item",
    "place",
    "container",
    "room",
    "building",
    "furniture",
  ];

  it.each(types)(
    "возвращает fallback для %s при ошибке БД или отсутствии записи",
    async (entityType) => {
      getServerUser.mockResolvedValue({ id: "user" });
      const supabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: "db error" } }),
      } as unknown as SupabaseClient;
      createClient.mockResolvedValue(supabase);

      const name = await getEntityNameForMetadata(entityType, 42);

      expect(name).toBe(
        {
          item: "Вещь",
          place: "Место",
          container: "Контейнер",
          room: "Помещение",
          building: "Здание",
          furniture: "Мебель",
        }[entityType]
      );
    }
  );

  it("возвращает name из БД, если он задан", async () => {
    getServerUser.mockResolvedValue({ id: "user" });
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 5, name: "  Комната  " },
      error: null,
    });
    const supabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle,
    } as unknown as SupabaseClient;
    createClient.mockResolvedValue(supabase);

    const name = await getEntityNameForMetadata("room", 5);

    expect(name).toBe("Комната");
  });

  it("возвращает fallback c #id, если name пустой", async () => {
    getServerUser.mockResolvedValue({ id: "user" });
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 7, name: "   " },
      error: null,
    });
    const supabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle,
    } as unknown as SupabaseClient;
    createClient.mockResolvedValue(supabase);

    const name = await getEntityNameForMetadata("item", 7);

    expect(name).toBe("Вещь #7");
  });
});

describe("generateEntityDetailMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает fallback title при неверном id", async () => {
    const meta = await generateEntityDetailMetadata(
      "container",
      Promise.resolve({ id: "abc" })
    );

    expect(meta.title).toBe("Контейнер");
  });

  it("для валидного id использует ту же логику, что и getEntityNameForMetadata", async () => {
    // getEntityNameForMetadata вернёт fallback, если пользователя нет
    getServerUser.mockResolvedValue(null);

    const meta = await generateEntityDetailMetadata(
      "place",
      Promise.resolve({ id: "10" })
    );

    expect(meta.title).toBe("Место");
  });
});


