import { renderHook } from "@testing-library/react";
import { useItemsActions } from "@/lib/entities/items/use-items-actions";

jest.mock("@/lib/entities/hooks/use-item-list-actions", () => ({
  useItemListActions: () => ({
    handleDeleteItem: jest.fn(),
    handleRestoreItem: jest.fn(),
    handleDuplicateItem: jest.fn(),
    handlePrintLabel: jest.fn(),
  }),
}));

describe("useItemsActions", () => {
  it("возвращает getRowActions с editHref и колбэками", () => {
    const refreshList = jest.fn();
    const { result } = renderHook(() =>
      useItemsActions({
        refreshList,
        basePath: "/items",
        labels: {
          singular: "Вещь",
          plural: "Вещи",
          results: { one: "вещь", few: "вещи", many: "вещей" },
          moveTitle: "Переместить",
          moveSuccess: () => "",
          moveError: "",
        },
      })
    );

    const actions = result.current({
      id: 1,
      name: "Item 1",
    } as Parameters<ReturnType<typeof useItemsActions>>[0]);

    expect(actions.editHref).toBe("/items/1");
    expect(typeof actions.onDelete).toBe("function");
    expect(typeof actions.onRestore).toBe("function");
    expect(typeof actions.onDuplicate).toBe("function");
    expect(typeof actions.onPrintLabel).toBe("function");
  });

  it("при move.enabled возвращает moveForm", () => {
    const { result } = renderHook(() =>
      useItemsActions({
        refreshList: jest.fn(),
        basePath: "/items",
        labels: {
          singular: "Вещь",
          plural: "Вещи",
          results: { one: "вещь", few: "вещи", many: "вещей" },
          moveTitle: "Переместить",
          moveSuccess: (name) => `Перемещено в ${name}`,
          moveError: "Ошибка",
        },
        move: {
          enabled: true,
          destinationTypes: ["room", "place"],
        },
      })
    );

    const actions = result.current({
      id: 1,
      name: "Item 1",
    } as Parameters<ReturnType<typeof useItemsActions>>[0]);

    expect(actions.moveForm).toBeDefined();
    expect(actions.moveForm?.title).toBe("Переместить");
  });

  it("при move.enabled=false возвращает moveForm: undefined", () => {
    const { result } = renderHook(() =>
      useItemsActions({
        refreshList: jest.fn(),
        basePath: "/items",
        labels: {
          singular: "Вещь",
          plural: "Вещи",
          results: { one: "вещь", few: "вещи", many: "вещей" },
          moveTitle: "Переместить",
          moveSuccess: () => "",
          moveError: "",
        },
        move: { enabled: false },
      })
    );

    const actions = result.current({
      id: 1,
      name: "Item 1",
    } as Parameters<ReturnType<typeof useItemsActions>>[0]);

    expect(actions.moveForm).toBeUndefined();
  });
});
