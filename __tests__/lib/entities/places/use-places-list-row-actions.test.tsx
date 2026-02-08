import { renderHook } from "@testing-library/react";
import { usePlacesListRowActions } from "@/lib/entities/places/use-places-list-row-actions";

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

describe("usePlacesListRowActions", () => {
  it("возвращает getRowActions", () => {
    const { result } = renderHook(() =>
      usePlacesListRowActions({ refreshList: jest.fn(), setMovingId: jest.fn() })
    );
    expect(typeof result.current).toBe("function");
  });

  it("getRowActions возвращает editHref и колбэки для места", () => {
    const { result } = renderHook(() =>
      usePlacesListRowActions({ refreshList: jest.fn(), setMovingId: jest.fn() })
    );
    const actions = result.current({ id: 5, name: "Shelf" } as never);
    expect(actions.editHref).toBe("/places/5");
  });
});
