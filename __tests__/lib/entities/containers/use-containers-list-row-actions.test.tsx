import { renderHook } from "@testing-library/react";
import { useContainersListRowActions } from "@/lib/entities/containers/use-containers-list-row-actions";

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

describe("useContainersListRowActions", () => {
  it("возвращает getRowActions", () => {
    const { result } = renderHook(() =>
      useContainersListRowActions({ refreshList: jest.fn(), setMovingId: jest.fn() })
    );
    expect(typeof result.current).toBe("function");
  });

  it("getRowActions возвращает editHref для контейнера", () => {
    const { result } = renderHook(() =>
      useContainersListRowActions({ refreshList: jest.fn(), setMovingId: jest.fn() })
    );
    const actions = result.current({ id: 3, name: "Box" } as never);
    expect(actions.editHref).toBe("/containers/3");
  });
});
