import { act, renderHook } from "@testing-library/react";
import { useRoomsActions } from "@/lib/entities/rooms/use-rooms-actions";
import * as softDeleteApiModule from "@/lib/shared/api/soft-delete";

jest.mock("@/lib/entities/hooks/use-print-entity-label", () => ({
  usePrintEntityLabel: () => jest.fn(),
}));
jest.mock("@/lib/shared/api/soft-delete");
jest.mock("@/lib/shared/api/duplicate-entity", () => ({
  duplicateEntityApi: { duplicate: jest.fn().mockResolvedValue({}) },
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const softDeleteApi = softDeleteApiModule.softDeleteApi as jest.Mocked<
  typeof softDeleteApiModule.softDeleteApi
>;

const baseLabels = {
  singular: "Помещение",
  plural: "Помещения",
  results: { one: "помещение", few: "помещения", many: "помещений" },
  moveTitle: "Переместить",
  moveSuccess: () => "",
  moveError: "",
};

describe("useRoomsActions", () => {
  const mockRefreshList = jest.fn();

  beforeEach(() => {
    mockRefreshList.mockClear();
    softDeleteApi.softDelete.mockResolvedValue({});
    softDeleteApi.restoreDeleted.mockResolvedValue({});
  });

  it("возвращает getRowActions с editHref", () => {
    const { result } = renderHook(() =>
      useRoomsActions({
        refreshList: mockRefreshList,
        basePath: "/rooms",
        apiTable: "rooms",
        labels: baseLabels,
      })
    );

    const actions = result.current({
      id: 1,
      name: "Room 1",
    } as Parameters<ReturnType<typeof useRoomsActions>>[0]);

    expect(actions.editHref).toBe("/rooms/1");
  });

  it("onDuplicate вызывает duplicateEntityApi", async () => {
    const { duplicateEntityApi } = jest.requireMock("@/lib/shared/api/duplicate-entity");
    const { result } = renderHook(() =>
      useRoomsActions({
        refreshList: mockRefreshList,
        basePath: "/rooms",
        apiTable: "rooms",
        labels: baseLabels,
      })
    );

    const actions = result.current({
      id: 3,
      name: "Room 3",
    } as Parameters<ReturnType<typeof useRoomsActions>>[0]);

    await act(async () => {
      await actions.onDuplicate?.();
    });

    expect(duplicateEntityApi.duplicate).toHaveBeenCalledWith("rooms", 3);
  });

  it("onDelete при отказе в confirm не вызывает API", async () => {
    const confirmSpy = jest.spyOn(globalThis, "confirm").mockImplementation(() => false);
    const { result } = renderHook(() =>
      useRoomsActions({
        refreshList: mockRefreshList,
        basePath: "/rooms",
        apiTable: "rooms",
        labels: { ...baseLabels, deleteConfirm: "Удалить?" },
      })
    );

    const actions = result.current({
      id: 1,
      name: "Room 1",
    } as Parameters<ReturnType<typeof useRoomsActions>>[0]);

    await act(async () => {
      await actions.onDelete?.();
    });

    expect(softDeleteApi.softDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("при ошибке API onRestore показывает toast.error", async () => {
    const { toast } = jest.requireMock("sonner");
    softDeleteApi.restoreDeleted.mockResolvedValue({ error: "Ошибка" });
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    toast.error.mockClear();

    const { result } = renderHook(() =>
      useRoomsActions({
        refreshList: mockRefreshList,
        basePath: "/rooms",
        apiTable: "rooms",
        labels: baseLabels,
      })
    );

    const actions = result.current({
      id: 1,
      name: "Room 1",
    } as Parameters<ReturnType<typeof useRoomsActions>>[0]);

    await act(async () => {
      await actions.onRestore?.();
    });

    expect(mockRefreshList).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
