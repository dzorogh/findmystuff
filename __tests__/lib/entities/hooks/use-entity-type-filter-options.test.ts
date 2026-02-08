import { renderHook } from "@testing-library/react";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";

jest.mock("@/lib/entities/hooks/use-entity-types", () => ({
  useEntityTypes: () => ({ types: [{ id: 1, name: "Type A" }], isLoading: false }),
}));

describe("useEntityTypeFilterOptions", () => {
  it("возвращает options и isLoading", () => {
    const { result } = renderHook(() =>
      useEntityTypeFilterOptions("place", true, false)
    );
    expect(result.current.isLoading).toBe(false);
    expect(Array.isArray(result.current.options)).toBe(true);
  });

  it("включает опцию «Все типы» при includeAll", () => {
    const { result } = renderHook(() =>
      useEntityTypeFilterOptions("place", true, false)
    );
    const allOption = result.current.options.find((o) => o.value === "all");
    expect(allOption?.label).toBe("Все типы");
  });
});
