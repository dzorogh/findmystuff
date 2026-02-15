import { renderHook, waitFor } from "@testing-library/react";
import { useFurniture } from "@/lib/furniture/hooks/use-furniture";
import { getFurnitureSimple } from "@/lib/furniture/api";

jest.mock("@/lib/furniture/api");

describe("useFurniture", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("загружает мебель и возвращает её", async () => {
    const mockFurniture = [{ id: 1, name: "Стол" }];
    (getFurnitureSimple as jest.Mock).mockResolvedValue({
      data: mockFurniture,
    });

    const { result } = renderHook(() => useFurniture(false));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.furniture).toEqual(mockFurniture);
    expect(result.current.error).toBeNull();
    expect(getFurnitureSimple).toHaveBeenCalledWith(false);
  });

  it("передаёт includeDeleted в getFurnitureSimple", async () => {
    (getFurnitureSimple as jest.Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useFurniture(true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getFurnitureSimple).toHaveBeenCalledWith(true);
  });

  it("устанавливает error при ошибке API", async () => {
    (getFurnitureSimple as jest.Mock).mockResolvedValue({
      error: "Ошибка загрузки",
    });

    const { result } = renderHook(() => useFurniture(false));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.furniture).toEqual([]);
  });

  it("refetch вызывает getFurnitureSimple снова", async () => {
    (getFurnitureSimple as jest.Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useFurniture(false));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getFurnitureSimple).toHaveBeenCalledTimes(1);

    await result.current.refetch();

    await waitFor(() => {
      expect(getFurnitureSimple).toHaveBeenCalledTimes(2);
    });
  });
});
