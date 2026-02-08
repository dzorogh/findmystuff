import { renderHook } from "@testing-library/react";
import { useItemsListRowActions } from "@/lib/entities/items/use-items-list-row-actions";

jest.mock("@/lib/entities/hooks/use-item-list-actions", () => ({
  useItemListActions: () => ({
    handleDeleteItem: jest.fn(),
    handleRestoreItem: jest.fn(),
    handleDuplicateItem: jest.fn(),
    handlePrintLabel: jest.fn(),
  }),
}));

describe("useItemsListRowActions", () => {
  it("возвращает getRowActions", () => {
    const { result } = renderHook(() =>
      useItemsListRowActions({ refreshList: jest.fn() })
    );
    expect(typeof result.current).toBe("function");
  });

  it("getRowActions возвращает editHref для вещи", () => {
    const { result } = renderHook(() =>
      useItemsListRowActions({ refreshList: jest.fn() })
    );
    const actions = result.current({ id: 10, name: "Item" } as never);
    expect(actions.editHref).toBe("/items/10");
  });
});
