import { act, renderHook, waitFor } from "@testing-library/react";
import { Pencil } from "lucide-react";
import { useListPage } from "@/lib/app/hooks/use-list-page";
import { TenantProvider } from "@/contexts/tenant-context";

jest.mock("nuqs");
jest.mock("@/lib/tenants/api", () => ({
  getTenants: jest.fn().mockResolvedValue([
    { id: 1, name: "Test", created_at: "2020-01-01T00:00:00Z" },
  ]),
  createTenant: jest.fn(),
  switchTenant: jest.fn().mockResolvedValue(undefined),
  createTenantRpc: jest.fn(),
}));
import type { EntityConfig } from "@/lib/app/types/entity-config";

function createTenantWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TenantProvider>{children}</TenantProvider>;
  };
}

function createMinimalConfig(
  overrides: Partial<{
    fetch: EntityConfig["fetch"];
    pagination: EntityConfig["pagination"];
    addForm: EntityConfig["addForm"];
  }> = {}
): EntityConfig {
  const fetchFn = overrides.fetch ?? jest.fn().mockResolvedValue({ data: [] });
  return {
    kind: "item",
    basePath: "/items",
    apiTable: "items",
    labels: {
      singular: "Вещь",
      plural: "Вещи",
      results: { one: "вещь", few: "вещи", many: "вещей" },
      moveTitle: "Переместить",
      moveSuccess: () => "",
      moveError: "",
    },
    actions: {
      whenActive: [
        {
          key: "edit",
          label: "Редактировать",
          icon: Pencil,
          getHref: (e) => `/items/${e.id}`,
        },
      ],
    },
    filters: {
      fields: [{ type: "showDeleted", label: "Удалённые" }],
      initial: { showDeleted: false },
    },
    columns: [{ key: "name", label: "Название" }],
    fetch: fetchFn,
    pagination: overrides.pagination,
    addForm: overrides.addForm ?? undefined,
  } as EntityConfig;
}

describe("useListPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("загружает данные при монтировании", async () => {
    const fetchData = jest.fn().mockResolvedValue({
      data: [{ id: 1, name: "Item 1" }],
    });
    const config = createMinimalConfig({ fetch: fetchData });

    const { result } = renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalled();
      expect(result.current.data).toEqual([{ id: 1, name: "Item 1" }]);
    });
  });

  it("возвращает базовые поля", async () => {
    const config = createMinimalConfig();
    const { result } = renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.searchQuery).toBe("");
    expect(typeof result.current.setSearchQuery).toBe("function");
    expect(typeof result.current.handleSearchChange).toBe("function");
    expect(typeof result.current.refreshList).toBe("function");
    expect(result.current.resultsCount).toBe(0);
  });

  it("обрабатывает ошибку загрузки", async () => {
    const fetchData = jest.fn().mockRejectedValue(new Error("Network error"));
    const config = createMinimalConfig({ fetch: fetchData });
    const { result } = renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
      expect(result.current.data).toEqual([]);
    });
  });

  it("без pagination не передаёт page в fetch", async () => {
    const fetchData = jest.fn().mockResolvedValue({ data: [] });
    const config = createMinimalConfig({
      fetch: fetchData,
      pagination: undefined,
    });
    renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          filterValues: { showDeleted: false },
        })
      );
      expect(fetchData.mock.calls[0][0]).not.toHaveProperty("page");
    });
  });

  it("с pagination передаёт page и totalCount", async () => {
    const fetchData = jest.fn().mockResolvedValue({
      data: [{ id: 1, name: "A" }],
      totalCount: 100,
    });
    const config = createMinimalConfig({
      fetch: fetchData,
      pagination: { pageSize: 10 },
    });
    const { result } = renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    await waitFor(() => {
      expect(result.current.pagination).toBeDefined();
      expect(result.current.pagination?.totalCount).toBe(100);
      expect(result.current.pagination?.pageSize).toBe(10);
      expect(result.current.pagination?.totalPages).toBe(10);
    });
  });

  it("handleSearchChange обновляет searchQuery", async () => {
    const config = createMinimalConfig();
    const { result } = renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    act(() => {
      result.current.handleSearchChange({
        target: { value: "test" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.searchQuery).toBe("test");
  });

  it("при addForm возвращает isAddFormOpen, handleAddFormOpenChange, handleEntityAdded", async () => {
    const config = createMinimalConfig({
      addForm: {
        title: "Добавить",
        form: () => null,
      } as EntityConfig["addForm"],
    });
    const { result } = renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAddFormOpen).toBe(false);
    expect(typeof result.current.handleAddFormOpenChange).toBe("function");
    expect(typeof result.current.handleEntityAdded).toBe("function");

    act(() => {
      result.current.handleAddFormOpenChange(true);
    });
    expect(result.current.isAddFormOpen).toBe(true);
  });

  it("goToPage меняет страницу и вызывает loadData", async () => {
    const fetchData = jest.fn().mockResolvedValue({
      data: [],
      totalCount: 50,
    });
    const config = createMinimalConfig({
      fetch: fetchData,
      pagination: { pageSize: 10 },
    });
    const { result } = renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    await waitFor(() => {
      expect(result.current.pagination?.totalPages).toBe(5);
    });

    fetchData.mockClear();
    act(() => {
      result.current.pagination?.goToPage(3);
    });

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 })
      );
    });
  });

  it("setSort и setFilters обновляют состояние", async () => {
    const config = createMinimalConfig();
    const { result } = renderHook(() => useListPage(config), { wrapper: createTenantWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSort("name_asc");
    });
    expect(result.current.sort).toBe("name_asc");

    act(() => {
      result.current.setFilters({ showDeleted: true });
    });
    expect(result.current.filters.showDeleted).toBe(true);
  });
});
