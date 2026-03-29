import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const cameraDialogProps: Record<string, unknown> = {};

jest.mock("@/lib/shared/api/search", () => ({
  searchApiClient: {
    searchText: jest.fn(),
    searchByPhoto: jest.fn(),
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

const searchApiClient = jest.requireMock("@/lib/shared/api/search")
  .searchApiClient as { searchText: jest.Mock; searchByPhoto: jest.Mock };

describe("Home page photo search", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.keys(cameraDialogProps).forEach((key) => delete cameraDialogProps[key]);
    URL.createObjectURL = jest.fn(() => "blob:home-photo-search-preview");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("показывает кнопку поиска по фото и выводит найденные вещи и контейнеры", async () => {
    searchApiClient.searchByPhoto.mockResolvedValue({
      data: [
        {
          entityType: "item",
          entityId: 15,
          title: "Пылесос Dyson",
          subtitle: "Пылесос",
          href: "/items/15",
          badges: [{ label: "Вещь", variant: "secondary" }],
          locationLines: [
            { key: "room", label: "Помещение", value: "Гардеробная" },
          ],
        },
        {
          entityType: "container",
          entityId: 9,
          title: "Контейнер Dyson",
          subtitle: "Коробка",
          href: "/containers/9",
          badges: [{ label: "Контейнер", variant: "secondary" }],
          locationLines: [
            { key: "room", label: "Помещение", value: "Гардеробная" },
          ],
        },
      ],
      totalCount: 2,
      meta: {
        mode: "image",
        scope: "global",
        totalCount: 2,
        noMatches: false,
      },
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
      expect(searchApiClient.searchByPhoto).toHaveBeenCalled();
      expect(screen.getByText("Пылесос Dyson")).toBeInTheDocument();
      expect(screen.getByText("Контейнер Dyson")).toBeInTheDocument();
      expect(screen.getByText(/Результаты поиска по фото/i)).toBeInTheDocument();
      expect(screen.getByText(/Найдено 2 результатов по фото/i)).toBeInTheDocument();
    });
  });

  it("не запускает повторный текстовый поиск после первого успешного ответа", async () => {
    jest.useFakeTimers();

    searchApiClient.searchText.mockResolvedValue({
      data: [
        {
          entityType: "item",
          entityId: 21,
          title: "Утюг",
          href: "/items/21",
          badges: [{ label: "Вещь", variant: "secondary" }],
          locationLines: [],
        },
      ],
      totalCount: 1,
      meta: {
        mode: "text",
        scope: "global",
        totalCount: 1,
        noMatches: false,
      },
    });

    const { default: HomePage } = await import("@/app/(app)/page");
    render(<HomePage />);

    fireEvent.change(
      screen.getByPlaceholderText(
        /Введите название вещи или контейнера/i
      ),
      { target: { value: "у" } }
    );

    expect(screen.getByText(/Ищем по запросу "у"/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(searchApiClient.searchText).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Утюг")).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(searchApiClient.searchText).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Ищем по запросу "у"/i)).not.toBeInTheDocument();
  });
});
