import { act, renderHook } from "@testing-library/react";
import { useItemListActions } from "@/lib/entities/hooks/use-item-list-actions";
import * as softDeleteApiModule from "@/lib/shared/api/soft-delete";
import * as duplicateEntityApiModule from "@/lib/shared/api/duplicate-entity";
import * as sonnerModule from "sonner";

jest.mock("@/lib/entities/hooks/use-print-entity-label", () => ({
  usePrintEntityLabel: () => jest.fn(),
}));
jest.mock("@/lib/shared/api/soft-delete");
jest.mock("@/lib/shared/api/duplicate-entity");
jest.mock("sonner");

describe("useItemListActions", () => {
  const mockRefreshList = jest.fn();
  const softDeleteApi = softDeleteApiModule.softDeleteApi as jest.Mocked<
    typeof softDeleteApiModule.softDeleteApi
  >;
  const duplicateEntityApi =
    duplicateEntityApiModule.duplicateEntityApi as jest.Mocked<
      typeof duplicateEntityApiModule.duplicateEntityApi
    >;
  const toast = sonnerModule.toast as jest.Mocked<typeof sonnerModule.toast>;

  let confirmSpy: jest.SpyInstance | null = null;

  beforeEach(() => {
    mockRefreshList.mockClear();
    softDeleteApi.softDelete.mockResolvedValue({});
    softDeleteApi.restoreDeleted.mockResolvedValue({});
    duplicateEntityApi.duplicate.mockResolvedValue({});
    toast.success.mockClear();
    toast.error.mockClear();
  });

  afterEach(() => {
    confirmSpy?.mockRestore();
  });

  it("возвращает handleDeleteItem, handleRestoreItem, handleDuplicateItem, handlePrintLabel", () => {
    const { result } = renderHook(() =>
      useItemListActions({ refreshList: mockRefreshList })
    );
    expect(typeof result.current.handleDeleteItem).toBe("function");
    expect(typeof result.current.handleRestoreItem).toBe("function");
    expect(typeof result.current.handleDuplicateItem).toBe("function");
    expect(typeof result.current.handlePrintLabel).toBe("function");
  });

  it("handleDeleteItem вызывает confirm и softDelete при подтверждении", async () => {
    confirmSpy = jest.spyOn(globalThis, "confirm").mockImplementation(() => true);
    const { result } = renderHook(() =>
      useItemListActions({ refreshList: mockRefreshList })
    );

    await act(async () => {
      await result.current.handleDeleteItem(1);
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      "Вы уверены, что хотите удалить эту вещь?"
    );
    expect(softDeleteApi.softDelete).toHaveBeenCalledWith("items", 1);
    expect(toast.success).toHaveBeenCalledWith("Вещь успешно удалена");
    expect(mockRefreshList).toHaveBeenCalled();
  });

  it("handleDeleteItem не вызывает API при отказе в confirm", async () => {
    const confirmFn = jest.fn(() => false);
    confirmSpy = jest.spyOn(globalThis, "confirm").mockImplementation(confirmFn);
    softDeleteApi.softDelete.mockClear();
    const { result } = renderHook(() =>
      useItemListActions({ refreshList: mockRefreshList })
    );

    await act(async () => {
      await result.current.handleDeleteItem(1);
    });

    expect(confirmFn).toHaveBeenCalled();
    expect(softDeleteApi.softDelete).not.toHaveBeenCalled();
    expect(mockRefreshList).not.toHaveBeenCalled();
  });

  it("handleRestoreItem вызывает restoreDeleted и refreshList", async () => {
    const { result } = renderHook(() =>
      useItemListActions({ refreshList: mockRefreshList })
    );

    await act(async () => {
      await result.current.handleRestoreItem(2);
    });

    expect(softDeleteApi.restoreDeleted).toHaveBeenCalledWith("items", 2);
    expect(toast.success).toHaveBeenCalledWith("Вещь успешно восстановлена");
    expect(mockRefreshList).toHaveBeenCalled();
  });

  it("handleDuplicateItem вызывает duplicate и refreshList", async () => {
    const { result } = renderHook(() =>
      useItemListActions({ refreshList: mockRefreshList })
    );

    await act(async () => {
      await result.current.handleDuplicateItem(3);
    });

    expect(duplicateEntityApi.duplicate).toHaveBeenCalledWith("items", 3);
    expect(toast.success).toHaveBeenCalledWith("Вещь успешно дублирована");
    expect(mockRefreshList).toHaveBeenCalled();
  });

  it("при ошибке API показывает toast.error и не вызывает refreshList", async () => {
    softDeleteApi.restoreDeleted.mockResolvedValue({
      error: "Ошибка восстановления",
    });
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const { result } = renderHook(() =>
      useItemListActions({ refreshList: mockRefreshList })
    );

    await act(async () => {
      await result.current.handleRestoreItem(1);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Произошла ошибка при восстановлении вещи"
    );
    expect(mockRefreshList).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("при исключении в API показывает toast.error", async () => {
    softDeleteApi.restoreDeleted.mockRejectedValue(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const { result } = renderHook(() =>
      useItemListActions({ refreshList: mockRefreshList })
    );

    await act(async () => {
      await result.current.handleRestoreItem(1);
    });

    expect(toast.error).toHaveBeenCalled();
    expect(mockRefreshList).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
