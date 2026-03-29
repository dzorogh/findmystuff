import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/app/hooks/use-list-page", () => ({
  useListPage: jest.fn(),
}));

jest.mock("@/lib/app/contexts/add-item-context", () => ({
  useAddItem: jest.fn(),
}));

jest.mock("@/lib/entities/hooks/use-item-list-actions", () => ({
  useItemListActions: jest.fn(),
}));

jest.mock("@/lib/entities/resolve-actions", () => ({
  resolveActions: jest.fn(() => []),
}));

jest.mock("@/lib/entities/api", () => ({
  updateItem: jest.fn(),
}));

jest.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <div>{actions}</div>
    </div>
  ),
}));

jest.mock("@/components/lists/entity-list", () => ({
  EntityList: ({
    data,
  }: {
    data: Array<{ id: number; name: string | null }>;
  }) => (
    <div>
      <div>
        {data.map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    </div>
  ),
}));

jest.mock("@/components/lists/list-pagination", () => ({
  ListPagination: () => null,
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

const useListPage = jest.requireMock("@/lib/app/hooks/use-list-page")
  .useListPage as jest.Mock;
const useAddItem = jest.requireMock("@/lib/app/contexts/add-item-context")
  .useAddItem as jest.Mock;
const useItemListActions = jest.requireMock("@/lib/entities/hooks/use-item-list-actions")
  .useItemListActions as jest.Mock;

describe("ItemsPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    useListPage.mockReturnValue({
      data: [{ id: 11, name: "Беспроводные наушники" }],
      isLoading: false,
      error: null,
      searchQuery: "",
      handleSearchChange: jest.fn(),
      sort: "created_at_desc",
      setSort: jest.fn(),
      filters: {
        showDeleted: false,
        entityTypeId: null,
        locationType: null,
        hasPhoto: null,
        roomId: null,
        placeId: null,
        containerId: null,
        furnitureId: null,
      },
      setFilters: jest.fn(),
      resetFilters: jest.fn(),
      isFiltersOpen: false,
      setIsFiltersOpen: jest.fn(),
      activeFiltersCount: 0,
      resultsCount: 0,
      results: { one: "вещь", few: "вещи", many: "вещей" },
      filterFields: [],
      columns: [],
      icon: undefined,
      kind: "item",
      getName: undefined,
      counts: undefined,
      labels: {
        plural: "Вещи",
      },
      addForm: {
        title: "Добавить вещь",
      },
      pagination: undefined,
      refreshList: jest.fn(),
    });

    useAddItem.mockReturnValue({
      openByPhoto: jest.fn(),
      openByBarcode: jest.fn(),
      openByForm: jest.fn(),
      setOnSuccess: jest.fn(),
      isBarcodeLookupLoading: false,
      isRecognizeLoading: false,
    });

    useItemListActions.mockReturnValue({
      handlePrintLabel: jest.fn(),
      handleDeleteItem: jest.fn(),
      handleDuplicateItem: jest.fn(),
      handleRestoreItem: jest.fn(),
    });
  });

  it("не показывает поиск по фото и рендерит обычный список вещей", async () => {
    const { default: ItemsPage } = await import("@/app/(app)/items/page");
    render(<ItemsPage />);

    expect(screen.queryByRole("button", { name: /Поиск по фото/i })).not.toBeInTheDocument();
    expect(screen.getByText("Беспроводные наушники")).toBeInTheDocument();
  });
});
