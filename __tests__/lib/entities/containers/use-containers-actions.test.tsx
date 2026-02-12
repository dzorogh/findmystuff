import { act, renderHook } from "@testing-library/react";
import { useContainersActions } from "@/lib/entities/containers/use-containers-actions";
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
  singular: "Контейнер",
  plural: "Контейнеры",
  results: { one: "контейнер", few: "контейнера", many: "контейнеров" },
  moveTitle: "Переместить",
  moveSuccess: () => "",
  moveError: "",
};

describe("useContainersActions", () => {
  const mockRefreshList = jest.fn();

  beforeEach(() => {
    mockRefreshList.mockClear();
    softDeleteApi.softDelete.mockResolvedValue({});
    softDeleteApi.restoreDeleted.mockResolvedValue({});
  });

  it("возвращает getRowActions с editHref", () => {
    const { result } = renderHook(() =>
      useContainersActions({
        refreshList: mockRefreshList,
        basePath: "/containers",
        apiTable: "containers",
        labels: baseLabels,
      })
    );

    const actions = result.current({
      id: 1,
      name: "Container 1",
    } as Parameters<ReturnType<typeof useContainersActions>>[0]);

    expect(actions.editHref).toBe("/containers/1");
  });

  it("onRestore вызывает restoreDeleted", async () => {
    const { result } = renderHook(() =>
      useContainersActions({
        refreshList: mockRefreshList,
        basePath: "/containers",
        apiTable: "containers",
        labels: baseLabels,
      })
    );

    const actions = result.current({
      id: 2,
      name: "Container 2",
    } as Parameters<ReturnType<typeof useContainersActions>>[0]);

    await act(async () => {
      await actions.onRestore?.();
    });

    expect(softDeleteApi.restoreDeleted).toHaveBeenCalledWith("containers", 2);
    expect(mockRefreshList).toHaveBeenCalled();
  });

  it("onDelete при confirm вызывает softDelete", async () => {
    const confirmSpy = jest.spyOn(globalThis, "confirm").mockImplementation(() => true);
    const { result } = renderHook(() =>
      useContainersActions({
        refreshList: mockRefreshList,
        basePath: "/containers",
        apiTable: "containers",
        labels: { ...baseLabels, deleteConfirm: "Удалить?" },
      })
    );

    const actions = result.current({
      id: 1,
      name: "Container 1",
    } as Parameters<ReturnType<typeof useContainersActions>>[0]);

    await act(async () => {
      await actions.onDelete?.();
    });

    expect(softDeleteApi.softDelete).toHaveBeenCalledWith("containers", 1);
    confirmSpy.mockRestore();
  });
});
