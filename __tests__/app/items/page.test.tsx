import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const cameraDialogProps: Record<string, unknown> = {};

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

jest.mock("@/lib/shared/api/item-photo-search", () => ({
  itemPhotoSearchApiClient: {
    search: jest.fn(),
  },
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
    toolbarActions,
    toolbarContent,
    data,
  }: {
    toolbarActions?: React.ReactNode;
    toolbarContent?: React.ReactNode;
    data: Array<{ id: number; name: string | null }>;
  }) => (
    <div>
      <div>{toolbarActions}</div>
      <div>{toolbarContent}</div>
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

jest.mock("@/components/common/camera-capture-dialog", () => ({
  CameraCaptureDialog: (props: unknown) => {
    Object.assign(cameraDialogProps, props);
    return (
      <div
        data-testid="photo-search-dialog"
        data-open={String((props as { open: boolean }).open)}
      />
    );
  },
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
const itemPhotoSearchApiClient = jest.requireMock("@/lib/shared/api/item-photo-search")
  .itemPhotoSearchApiClient as { search: jest.Mock };

describe("ItemsPage photo search", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.keys(cameraDialogProps).forEach((key) => delete cameraDialogProps[key]);
    URL.createObjectURL = jest.fn(() => "blob:photo-search-preview");
    URL.revokeObjectURL = jest.fn();

    useListPage.mockReturnValue({
      data: [],
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

  it("открывает диалог поиска по фото и показывает найденные результаты", async () => {
    itemPhotoSearchApiClient.search.mockResolvedValue({
      data: [
        {
          id: 11,
          name: "Беспроводные наушники",
          search_match: {
            similarity: 0.91,
            source: "text",
          },
        },
      ],
      totalCount: 1,
      noSimilarFound: false,
    });

    const { default: ItemsPage } = await import("@/app/(app)/items/page");
    render(<ItemsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Поиск по фото/i }));
    expect(screen.getByTestId("photo-search-dialog")).toHaveAttribute(
      "data-open",
      "true"
    );

    await act(async () => {
      await (cameraDialogProps.onCapture as (blob: Blob) => Promise<void>)(
        new File(["img"], "query.jpg", { type: "image/jpeg" })
      );
    });

    await waitFor(() => {
      expect(itemPhotoSearchApiClient.search).toHaveBeenCalled();
      expect(screen.getByText("Беспроводные наушники")).toBeInTheDocument();
      expect(screen.getByText(/Найдено 1 похожих вещей/i)).toBeInTheDocument();
    });
  });
});
