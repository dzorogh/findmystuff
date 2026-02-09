import { renderHook } from "@testing-library/react";
import { useItemListActions } from "@/lib/entities/hooks/use-item-list-actions";

jest.mock("@/lib/entities/hooks/use-print-entity-label", () => ({
  usePrintEntityLabel: () => jest.fn(),
}));
jest.mock("@/lib/shared/api/soft-delete", () => ({
  softDeleteApi: { softDelete: jest.fn(), restoreDeleted: jest.fn() },
}));
jest.mock("@/lib/shared/api/duplicate-entity", () => ({
  duplicateEntityApi: { duplicate: jest.fn().mockResolvedValue({}) },
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

describe("useItemListActions", () => {
  it("возвращает handleDeleteItem, handleRestoreItem, handleDuplicateItem, handlePrintLabel", () => {
    const { result } = renderHook(() =>
      useItemListActions({ refreshList: jest.fn() })
    );
    expect(typeof result.current.handleDeleteItem).toBe("function");
    expect(typeof result.current.handleRestoreItem).toBe("function");
    expect(typeof result.current.handleDuplicateItem).toBe("function");
    expect(typeof result.current.handlePrintLabel).toBe("function");
  });
});
