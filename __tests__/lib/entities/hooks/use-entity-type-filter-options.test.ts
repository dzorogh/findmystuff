import { renderHook } from "@testing-library/react";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";

jest.mock("@/lib/entities/hooks/use-entity-types");

const mockUseEntityTypes = useEntityTypes as jest.MockedFunction<
  typeof useEntityTypes
>;

describe("useEntityTypeFilterOptions", () => {
  it("возвращает options и isLoading", () => {
    mockUseEntityTypes.mockReturnValue({
      types: [{ id: 1, name: "Type A" }],
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useEntityTypeFilterOptions("place", true, false)
    );
    expect(result.current.isLoading).toBe(false);
    expect(Array.isArray(result.current.options)).toBe(true);
  });

  it("включает опцию «Все типы» при includeAll=true", () => {
    mockUseEntityTypes.mockReturnValue({
      types: [{ id: 1, name: "Type A" }],
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useEntityTypeFilterOptions("place", true, false)
    );
    const allOption = result.current.options.find((o) => o.value === "all");
    expect(allOption?.label).toBe("Все типы");
  });

  it("не включает «Все типы» при includeAll=false", () => {
    mockUseEntityTypes.mockReturnValue({
      types: [{ id: 1, name: "Type A" }],
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useEntityTypeFilterOptions("place", false, false)
    );
    const allOption = result.current.options.find((o) => o.value === "all");
    expect(allOption).toBeUndefined();
  });

  it("включает опцию «Не указан» при includeEmpty=true", () => {
    mockUseEntityTypes.mockReturnValue({ types: [], isLoading: false });

    const { result } = renderHook(() =>
      useEntityTypeFilterOptions("place", true, true)
    );
    const emptyOption = result.current.options.find((o) => o.value === "");
    expect(emptyOption?.label).toBe("Не указан");
  });

  it("возвращает только «Все типы» при пустом types и includeAll", () => {
    mockUseEntityTypes.mockReturnValue({ types: [], isLoading: false });

    const { result } = renderHook(() =>
      useEntityTypeFilterOptions("place", true, false)
    );
    expect(result.current.options).toEqual([{ value: "all", label: "Все типы" }]);
  });

  it("добавляет типы в options", () => {
    mockUseEntityTypes.mockReturnValue({
      types: [
        { id: 1, name: "Тип A" },
        { id: 2, name: "Тип B" },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useEntityTypeFilterOptions("container", true, false)
    );
    expect(result.current.options).toContainEqual({ value: "1", label: "Тип A" });
    expect(result.current.options).toContainEqual({ value: "2", label: "Тип B" });
  });
});
