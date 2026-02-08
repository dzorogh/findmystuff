import { renderHook } from "@testing-library/react";
import { useRoomFilterOptions } from "@/lib/rooms/hooks/use-room-filter-options";
import * as UseRoomsModule from "@/lib/rooms/hooks/use-rooms";

jest.mock("@/lib/rooms/hooks/use-rooms", () => {
  const mockUseRooms = jest.fn();
  return {
    useRooms: (...args: unknown[]) => mockUseRooms(...args),
    mockUseRooms,
  };
});

const mockUseRooms = (UseRoomsModule as typeof UseRoomsModule & { mockUseRooms: jest.Mock }).mockUseRooms;

describe("useRoomFilterOptions", () => {
  beforeEach(() => {
    mockUseRooms.mockReturnValue({
      rooms: [{ id: 1, name: "Room A" }],
      isLoading: false,
    });
  });

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

  it("при isLoading: true возвращает только опцию «Все помещения»", () => {
    mockUseRooms.mockReturnValue({ rooms: [], isLoading: true });
    const { result } = renderHook(() => useRoomFilterOptions());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.options).toEqual([
      { value: "all", label: "Все помещения" },
    ]);
  });

  it("при пустом списке rooms возвращает только опцию «Все помещения»", () => {
    mockUseRooms.mockReturnValue({ rooms: [], isLoading: false });
    const { result } = renderHook(() => useRoomFilterOptions());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.options).toEqual([
      { value: "all", label: "Все помещения" },
    ]);
  });
});
