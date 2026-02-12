import { act, renderHook } from "@testing-library/react";
import { usePlacesActions } from "@/lib/entities/places/use-places-actions";
import * as softDeleteApiModule from "@/lib/shared/api/soft-delete";
import * as duplicateEntityApiModule from "@/lib/shared/api/duplicate-entity";

jest.mock("@/lib/entities/hooks/use-print-entity-label", () => ({
  usePrintEntityLabel: () => jest.fn(),
}));
jest.mock("@/lib/shared/api/soft-delete");
jest.mock("@/lib/shared/api/duplicate-entity");
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const softDeleteApi = softDeleteApiModule.softDeleteApi as jest.Mocked<
  typeof softDeleteApiModule.softDeleteApi
>;
const duplicateEntityApi =
  duplicateEntityApiModule.duplicateEntityApi as jest.Mocked<
    typeof duplicateEntityApiModule.duplicateEntityApi
  >;

const baseLabels = {
  singular: "Место",
  plural: "Места",
  results: { one: "место", few: "места", many: "мест" },
  moveTitle: "Переместить",
  moveSuccess: () => "",
  moveError: "",
};

describe("usePlacesActions", () => {
  const mockRefreshList = jest.fn();

  beforeEach(() => {
    mockRefreshList.mockClear();
    softDeleteApi.softDelete.mockResolvedValue({});
    softDeleteApi.restoreDeleted.mockResolvedValue({});
    duplicateEntityApi.duplicate.mockResolvedValue({});
  });

  it("возвращает getRowActions с editHref", () => {
    const { result } = renderHook(() =>
      usePlacesActions({
        refreshList: mockRefreshList,
        basePath: "/places",
        apiTable: "places",
        labels: baseLabels,
      })
    );

    const actions = result.current({
      id: 1,
      name: "Place 1",
    } as Parameters<ReturnType<typeof usePlacesActions>>[0]);

    expect(actions.editHref).toBe("/places/1");
  });

  it("при move.enabled возвращает moveForm", () => {
    const { result } = renderHook(() =>
      usePlacesActions({
        refreshList: mockRefreshList,
        basePath: "/places",
        apiTable: "places",
        labels: baseLabels,
        move: { enabled: true, destinationTypes: ["room", "container"] },
      })
    );

    const actions = result.current({
      id: 1,
      name: "Place 1",
    } as Parameters<ReturnType<typeof usePlacesActions>>[0]);

    expect(actions.moveForm).toBeDefined();
  });

  it("onRestore вызывает restoreDeleted", async () => {
    const { result } = renderHook(() =>
      usePlacesActions({
        refreshList: mockRefreshList,
        basePath: "/places",
        apiTable: "places",
        labels: baseLabels,
      })
    );

    const actions = result.current({
      id: 2,
      name: "Place 2",
    } as Parameters<ReturnType<typeof usePlacesActions>>[0]);

    await act(async () => {
      await actions.onRestore?.();
    });

    expect(softDeleteApi.restoreDeleted).toHaveBeenCalledWith("places", 2);
    expect(mockRefreshList).toHaveBeenCalled();
  });

  it("onDelete при отказе в confirm не вызывает API", async () => {
    const confirmSpy = jest.spyOn(globalThis, "confirm").mockImplementation(() => false);
    const { result } = renderHook(() =>
      usePlacesActions({
        refreshList: mockRefreshList,
        basePath: "/places",
        apiTable: "places",
        labels: { ...baseLabels, deleteConfirm: "Удалить место?" },
      })
    );

    const actions = result.current({
      id: 1,
      name: "Place 1",
    } as Parameters<ReturnType<typeof usePlacesActions>>[0]);

    await act(async () => {
      await actions.onDelete?.();
    });

    expect(softDeleteApi.softDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("destinationTypes из move.destinationTypes когда заданы", () => {
    const { result } = renderHook(() =>
      usePlacesActions({
        refreshList: mockRefreshList,
        basePath: "/places",
        apiTable: "places",
        labels: baseLabels,
        move: { enabled: true, destinationTypes: ["room"] },
      })
    );

    const actions = result.current({
      id: 1,
      name: "Place 1",
    } as Parameters<ReturnType<typeof usePlacesActions>>[0]);

    expect(actions.moveForm?.destinationTypes).toEqual(["room"]);
  });
});
