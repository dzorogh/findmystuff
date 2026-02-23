import { renderHook, waitFor } from "@testing-library/react";
import { useFurnitureFilterOptions } from "@/lib/furniture/hooks/use-furniture-filter-options";
import { useFurniture } from "@/lib/furniture/hooks/use-furniture";

jest.mock("@/lib/furniture/hooks/use-furniture");

describe("useFurnitureFilterOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает только «Вся мебель» пока загрузка", () => {
    (useFurniture as jest.Mock).mockReturnValue({
      furniture: [],
      isLoading: true,
    });

    const { result } = renderHook(() => useFurnitureFilterOptions());

    expect(result.current.options).toEqual([{ value: "all", label: "Вся мебель" }]);
    expect(result.current.isLoading).toBe(true);
  });

  it("возвращает мебель с названием помещения после загрузки", async () => {
    (useFurniture as jest.Mock).mockReturnValue({
      furniture: [
        { id: 1, name: "Стол", room: { id: 10, name: "Кухня" } },
        { id: 2, name: null, room: null },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useFurnitureFilterOptions());

    await waitFor(() => {
      expect(result.current.options.length).toBe(3);
    });

    expect(result.current.options[0]).toEqual({ value: "all", label: "Вся мебель" });
    expect(result.current.options[1]).toEqual({
      value: "1",
      label: "Стол (Кухня)",
    });
    expect(result.current.options[2]).toEqual({
      value: "2",
      label: "Мебель #2",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("возвращает только «Вся мебель» если массив пуст", () => {
    (useFurniture as jest.Mock).mockReturnValue({
      furniture: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useFurnitureFilterOptions());

    expect(result.current.options).toEqual([{ value: "all", label: "Вся мебель" }]);
  });
});
