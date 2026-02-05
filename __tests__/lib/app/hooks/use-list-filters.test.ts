import { renderHook, act } from "@testing-library/react";
import { useListFiltersState } from "@/lib/app/hooks/use-list-filters";

describe("useListFiltersState", () => {
  it("возвращает initialFilters и setFilters", () => {
    const initial = { showDeleted: false, hasItems: null as boolean | null };
    const { result } = renderHook(() => useListFiltersState(initial));

    expect(result.current.filters).toEqual(initial);
    expect(typeof result.current.setFilters).toBe("function");
  });

  it("без externalShowDeleted effectiveFilters совпадает с filters после setFilters", () => {
    const initial = { showDeleted: false, hasItems: null as boolean | null };
    const { result } = renderHook(() => useListFiltersState(initial));

    act(() => {
      result.current.setFilters({ ...initial, showDeleted: true, hasItems: true });
    });

    expect(result.current.filters.showDeleted).toBe(true);
    expect(result.current.filters.hasItems).toBe(true);
  });

  it("при externalShowDeleted подставляет showDeleted в effectiveFilters", () => {
    const initial = { showDeleted: false, hasItems: null as boolean | null };
    const { result } = renderHook(() =>
      useListFiltersState(initial, true)
    );

    expect(result.current.filters.showDeleted).toBe(true);

    act(() => {
      result.current.setFilters({ ...initial, showDeleted: false });
    });

    expect(result.current.filters.showDeleted).toBe(true);
  });

  it("при externalShowDeleted undefined использует внутренний showDeleted", () => {
    const initial = { showDeleted: false, hasItems: null as boolean | null };
    const { result } = renderHook(() => useListFiltersState(initial, undefined));

    expect(result.current.filters.showDeleted).toBe(false);

    act(() => {
      result.current.setFilters({ ...initial, showDeleted: true });
    });

    expect(result.current.filters.showDeleted).toBe(true);
  });
});
