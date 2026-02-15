import { renderHook, waitFor } from "@testing-library/react";
import { useBuildings } from "@/lib/buildings/hooks/use-buildings";
import { getBuildingsSimple } from "@/lib/buildings/api";

jest.mock("@/lib/buildings/api");

describe("useBuildings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("загружает здания и возвращает их", async () => {
    const mockBuildings = [{ id: 1, name: "Building A" }];
    (getBuildingsSimple as jest.Mock).mockResolvedValue({
      data: mockBuildings,
    });

    const { result } = renderHook(() => useBuildings(false));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.buildings).toEqual(mockBuildings);
    expect(result.current.error).toBeNull();
    expect(getBuildingsSimple).toHaveBeenCalledWith(false);
  });

  it("передаёт includeDeleted в getBuildingsSimple", async () => {
    (getBuildingsSimple as jest.Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useBuildings(true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getBuildingsSimple).toHaveBeenCalledWith(true);
  });

  it("устанавливает error при ошибке API", async () => {
    (getBuildingsSimple as jest.Mock).mockResolvedValue({
      error: "Ошибка загрузки",
    });

    const { result } = renderHook(() => useBuildings(false));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.buildings).toEqual([]);
  });

  it("refetch вызывает getBuildingsSimple снова", async () => {
    (getBuildingsSimple as jest.Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useBuildings(false));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getBuildingsSimple).toHaveBeenCalledTimes(1);

    await result.current.refetch();

    await waitFor(() => {
      expect(getBuildingsSimple).toHaveBeenCalledTimes(2);
    });
  });
});
