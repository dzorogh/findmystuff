import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemSearchIndexCard } from "@/components/settings/item-search-index-card";

const mockRunItemSearchIndexBackfillBatch = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("@/lib/entities/items/search-index", () => ({
  runItemSearchIndexBackfillBatch: (...args: unknown[]) =>
    mockRunItemSearchIndexBackfillBatch(...args),
}));

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

describe("ItemSearchIndexCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunItemSearchIndexBackfillBatch.mockReset();
  });

  it("запускает переиндексацию по батчам и показывает итог", async () => {
    mockRunItemSearchIndexBackfillBatch
      .mockResolvedValueOnce({
        processed: 20,
        nextCursor: { entityType: "item", afterId: 20 },
      })
      .mockResolvedValueOnce({ processed: 7, nextCursor: null });

    const user = userEvent.setup();

    render(<ItemSearchIndexCard />);

    await user.click(screen.getByRole("button", { name: "Переиндексировать" }));

    await waitFor(() => {
      expect(mockRunItemSearchIndexBackfillBatch).toHaveBeenNthCalledWith(1, {
        cursor: null,
        limit: 5,
      });
      expect(mockRunItemSearchIndexBackfillBatch).toHaveBeenNthCalledWith(2, {
        cursor: {
          entityType: "item",
          afterId: 20,
        },
        limit: 5,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Обработано: 27")).toBeInTheDocument();
      expect(screen.getByText("Батчей: 2")).toBeInTheDocument();
      expect(
        screen.getByText("Готово. Обработано 27 сущностей за 2 батч(ей).")
      ).toBeInTheDocument();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Переиндексация завершена. Обработано 27 сущностей."
    );
  });

  it("показывает ошибку, если backfill завершился неудачно", async () => {
    mockRunItemSearchIndexBackfillBatch.mockRejectedValueOnce(
      new Error("OPENAI_API_KEY не настроен")
    );

    const user = userEvent.setup();

    render(<ItemSearchIndexCard />);

    await user.click(screen.getByRole("button", { name: "Переиндексировать" }));

    await waitFor(() => {
      expect(screen.getByText("OPENAI_API_KEY не настроен")).toBeInTheDocument();
    });

    expect(mockToastError).toHaveBeenCalledWith("OPENAI_API_KEY не настроен");
  });
});
