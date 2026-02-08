import type {
  FetchListParams,
  FetchListResult,
  ListColumnConfig,
  ListConfig,
  ListPageConfig,
} from "@/lib/app/types/list-config";

describe("list-config types", () => {
  it("FetchListParams допускает типичные параметры", () => {
    const params: FetchListParams = {
      query: "test",
      filters: { showDeleted: false },
      sortBy: "name",
      sortDirection: "asc",
    };
    expect(params.sortBy).toBe("name");
  });

  it("FetchListResult допускает data и totalCount", () => {
    const result: FetchListResult = { data: [], totalCount: 0 };
    expect(result.data).toEqual([]);
  });

  it("ListColumnConfig допускает key, label и опциональные поля", () => {
    const col: ListColumnConfig = { key: "name", label: "Название", width: "w-80" };
    expect(col.key).toBe("name");
  });

  it("ListConfig и ListPageConfig экспортируются и совместимы с конфигами сущностей", () => {
    const config: ListConfig<{ showDeleted: boolean }> = {
      filterConfig: [],
      columnsConfig: [],
      actionsConfig: { actions: ["edit"] },
      moveFormConfig: { enabled: false },
      resultsLabel: { one: "a", few: "b", many: "c" },
      initialFilters: { showDeleted: false },
    };
    expect(config.initialFilters.showDeleted).toBe(false);
  });
});
