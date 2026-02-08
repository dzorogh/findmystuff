import { renderHook } from "@testing-library/react";
import { useRoomFilterOptions } from "@/lib/rooms/hooks/use-room-filter-options";

jest.mock("@/lib/rooms/hooks/use-rooms", () => ({
  useRooms: () => ({
    rooms: [{ id: 1, name: "Room A" }],
    isLoading: false,
  }),
}));

describe("useRoomFilterOptions", () => {
  it("возвращает options и isLoading", () => {
    const { result } = renderHook(() => useRoomFilterOptions());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.options.length).toBeGreaterThan(0);
  });

  it("включает опцию «Все помещения»", () => {
    const { result } = renderHook(() => useRoomFilterOptions());
    const allOption = result.current.options.find((o) => o.value === "all");
    expect(allOption?.label).toBe("Все помещения");
  });
});
