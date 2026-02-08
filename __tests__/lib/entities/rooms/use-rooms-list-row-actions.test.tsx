import { renderHook } from "@testing-library/react";
import { useRoomsListRowActions } from "@/lib/entities/rooms/use-rooms-list-row-actions";

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

describe("useRoomsListRowActions", () => {
  it("возвращает функцию getRowActions", () => {
    const { result } = renderHook(() =>
      useRoomsListRowActions({ refreshList: jest.fn() })
    );
    expect(typeof result.current).toBe("function");
  });

  it("getRowActions возвращает объект с editHref и колбэками", () => {
    const { result } = renderHook(() =>
      useRoomsListRowActions({ refreshList: jest.fn() })
    );
    const actions = result.current({ id: 1, name: "Room" } as never);
    expect(actions.editHref).toBe("/rooms/1");
    expect(typeof actions.onDelete).toBe("function");
    expect(typeof actions.onPrintLabel).toBe("function");
  });
});
