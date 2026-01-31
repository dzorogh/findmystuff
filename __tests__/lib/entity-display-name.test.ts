import { getEntityDisplayName, ENTITY_TYPE_LABELS } from "@/lib/entities/helpers/display-name";

describe("entity-display-name", () => {
  it("возвращает name, если задано и не пустое", () => {
    expect(getEntityDisplayName("container", 1, "Коробка")).toBe("Коробка");
    expect(getEntityDisplayName("item", 2, "Вещь")).toBe("Вещь");
  });

  it("возвращает «Тип #id» при null", () => {
    expect(getEntityDisplayName("container", 3, null)).toBe("Контейнер #3");
    expect(getEntityDisplayName("item", 99, null)).toBe("Вещь #99");
    expect(getEntityDisplayName("place", 5, null)).toBe("Место #5");
    expect(getEntityDisplayName("room", 1, null)).toBe("Помещение #1");
  });

  it("возвращает «Тип #id» при пустой строке", () => {
    expect(getEntityDisplayName("container", 3, "")).toBe("Контейнер #3");
    expect(getEntityDisplayName("container", 3, "   ")).toBe("Контейнер #3");
  });

  it("ENTITY_TYPE_LABELS содержит все типы", () => {
    expect(ENTITY_TYPE_LABELS.item).toBe("Вещь");
    expect(ENTITY_TYPE_LABELS.place).toBe("Место");
    expect(ENTITY_TYPE_LABELS.container).toBe("Контейнер");
    expect(ENTITY_TYPE_LABELS.room).toBe("Помещение");
  });
});
