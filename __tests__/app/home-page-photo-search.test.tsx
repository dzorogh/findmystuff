import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const pushMock = jest.fn();
const cameraDialogProps: Record<string, unknown> = {};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("@/lib/shared/api/search", () => ({
  searchApiClient: {
    search: jest.fn(),
  },
}));

jest.mock("@/lib/shared/api/item-photo-search", () => ({
  itemPhotoSearchApiClient: {
    search: jest.fn(),
  },
}));

jest.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

jest.mock("@/components/common/camera-capture-dialog", () => ({
  CameraCaptureDialog: (props: unknown) => {
    Object.assign(cameraDialogProps, props);
    return (
      <div
        data-testid="home-photo-search-dialog"
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

const itemPhotoSearchApiClient = jest.requireMock("@/lib/shared/api/item-photo-search")
  .itemPhotoSearchApiClient as { search: jest.Mock };

describe("Home page photo search", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.keys(cameraDialogProps).forEach((key) => delete cameraDialogProps[key]);
    URL.createObjectURL = jest.fn(() => "blob:home-photo-search-preview");
    URL.revokeObjectURL = jest.fn();
  });

  it("показывает кнопку поиска по фото и выводит найденные вещи", async () => {
    itemPhotoSearchApiClient.search.mockResolvedValue({
      data: [
        {
          id: 15,
          name: "Пылесос Dyson",
          item_type: { name: "Пылесос" },
          last_location: { room_name: "Гардеробная" },
          search_match: {
            similarity: 0.88,
            source: "text",
          },
        },
      ],
      totalCount: 1,
      noSimilarFound: false,
    });

    const { default: HomePage } = await import("@/app/(app)/page");
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: /Поиск по фото/i }));
    expect(screen.getByTestId("home-photo-search-dialog")).toHaveAttribute(
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
      expect(screen.getByText("Пылесос Dyson")).toBeInTheDocument();
      expect(screen.getByText(/Результаты поиска по фото/i)).toBeInTheDocument();
      expect(screen.getByText(/Найдено 1 похожих вещей/i)).toBeInTheDocument();
    });
  });
});
