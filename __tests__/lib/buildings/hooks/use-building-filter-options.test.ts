import { renderHook, waitFor } from "@testing-library/react";
import { useBuildingFilterOptions } from "@/lib/buildings/hooks/use-building-filter-options";
import { useBuildings } from "@/lib/buildings/hooks/use-buildings";

jest.mock("@/lib/buildings/hooks/use-buildings");

describe("useBuildingFilterOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает только «Все здания» пока загрузка", () => {
    (useBuildings as jest.Mock).mockReturnValue({
      buildings: [],
      isLoading: true,
    });

    const { result } = renderHook(() => useBuildingFilterOptions());

    expect(result.current.options).toEqual([{ value: "all", label: "Все здания" }]);
    expect(result.current.isLoading).toBe(true);
  });

  it("возвращает здания после загрузки", async () => {
    (useBuildings as jest.Mock).mockReturnValue({
      buildings: [
        { id: 1, name: "Здание A" },
        { id: 2, name: null },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useBuildingFilterOptions());

    await waitFor(() => {
      expect(result.current.options.length).toBe(3);
    });

    expect(result.current.options[0]).toEqual({ value: "all", label: "Все здания" });
    expect(result.current.options[1]).toEqual({ value: "1", label: "Здание A" });
    expect(result.current.options[2]).toEqual({ value: "2", label: "Здание #2" });
    expect(result.current.isLoading).toBe(false);
  });

  it("возвращает только «Все здания» если массив пуст", () => {
    (useBuildings as jest.Mock).mockReturnValue({
      buildings: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useBuildingFilterOptions());

    expect(result.current.options).toEqual([{ value: "all", label: "Все здания" }]);
  });
});
