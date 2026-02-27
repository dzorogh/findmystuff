import type { SupabaseClient } from "@supabase/supabase-js";
import { seedDefaultEntityTypesForTenant } from "@/lib/tenants/seed-default-entity-types";

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

const { readFile } = jest.requireMock("fs/promises") as {
  readFile: jest.Mock;
};

describe("seedDefaultEntityTypesForTenant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ничего не делает, если в конфиге нет валидных имён", async () => {
    readFile.mockResolvedValue(
      JSON.stringify({
        building: [],
        item: [""],
      })
    );

    const from = jest.fn();
    const supabase = { from } as unknown as SupabaseClient;

    await seedDefaultEntityTypesForTenant(supabase, 1);

    expect(from).not.toHaveBeenCalled();
  });

  it("создаёт строки для всех категорий и вызывает insert", async () => {
    readFile.mockResolvedValue(
      JSON.stringify({
        building: ["Дом"],
        container: ["Коробка", "   "],
        room: ["Кухня"],
      })
    );

    const insert = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn().mockReturnValue({ insert });
    const supabase = { from } as unknown as SupabaseClient;

    await seedDefaultEntityTypesForTenant(supabase, 2);

    expect(from).toHaveBeenCalledWith("entity_types");
    expect(insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        { tenant_id: 2, entity_category: "building", name: "Дом" },
        { tenant_id: 2, entity_category: "container", name: "Коробка" },
        { tenant_id: 2, entity_category: "room", name: "Кухня" },
      ])
    );
  });

  it("бросает ошибку, если insert вернул error", async () => {
    readFile.mockResolvedValue(
      JSON.stringify({
        item: ["Книга"],
      })
    );

    const insert = jest.fn().mockResolvedValue({
      error: { message: "db error" },
    });
    const from = jest.fn().mockReturnValue({ insert });
    const supabase = { from } as unknown as SupabaseClient;

    await expect(
      seedDefaultEntityTypesForTenant(supabase, 3)
    ).rejects.toThrow("Ошибка создания дефолтных типов: db error");
  });
});

