import {
  type EntityTypeRelation,
  normalizeEntityTypeRelation,
} from "@/lib/shared/api/normalize-entity-type-relation";

describe("normalizeEntityTypeRelation", () => {
  it("возвращает null для null/undefined", () => {
    expect(normalizeEntityTypeRelation<EntityTypeRelation>(null)).toBeNull();
    expect(
      normalizeEntityTypeRelation<EntityTypeRelation>(undefined)
    ).toBeNull();
  });

  it("возвращает первый элемент массива", () => {
    const relationArray: EntityTypeRelation[] = [
      { name: "Первый" },
      { name: "Второй" },
    ];

    expect(
      normalizeEntityTypeRelation<EntityTypeRelation>(relationArray)
    ).toEqual({ name: "Первый" });
  });

  it("возвращает null для пустого массива", () => {
    expect(
      normalizeEntityTypeRelation<EntityTypeRelation>([])
    ).toBeNull();
  });

  it("возвращает объект как есть, если передан одиночный relation", () => {
    const relation: EntityTypeRelation = { name: "Тип" };

    expect(
      normalizeEntityTypeRelation<EntityTypeRelation>(relation)
    ).toBe(relation);
  });
});

