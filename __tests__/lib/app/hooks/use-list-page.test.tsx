import { renderHook, waitFor } from "@testing-library/react";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import type { ListPageConfig } from "@/lib/app/types/list-config";

const minimalConfig: ListPageConfig = {
  filterConfig: [],
  columnsConfig: [{ key: "name", label: "Название" }],
  actionsConfig: { actions: ["edit"] },
  moveFormConfig: { enabled: false },
  resultsLabel: { one: "a", few: "b", many: "c" },
  initialFilters: { showDeleted: false },
  fetchList: jest.fn().mockResolvedValue({ data: [] }),
};

describe("useListPage", () => {
  beforeEach(() => {
    (minimalConfig.fetchList as jest.Mock).mockResolvedValue({ data: [] });
  });

  it("возвращает состояние списка и вызывает fetchList", async () => {
    const { result } = renderHook(() => useListPage(minimalConfig));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(minimalConfig.fetchList).toHaveBeenCalled();
  });
});
