import { renderHook, act } from "@testing-library/react";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";

jest.mock("@/lib/entities/helpers/label-print", () => ({
  printEntityLabel: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const { printEntityLabel } = require("@/lib/entities/helpers/label-print");
const { toast } = require("sonner");

describe("usePrintEntityLabel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (printEntityLabel as jest.Mock).mockResolvedValue(undefined);
  });

  it("возвращает функцию printLabel", () => {
    const { result } = renderHook(() => usePrintEntityLabel("item"));

    expect(typeof result.current).toBe("function");
  });

  it("вызывает printEntityLabel при вызове printLabel", async () => {
    const { result } = renderHook(() => usePrintEntityLabel("container"));

    await act(async () => {
      await result.current(1, "Box");
    });

    expect(printEntityLabel).toHaveBeenCalledWith("container", 1, "Box");
  });

  it("при ошибке вызывает toast.error", async () => {
    (printEntityLabel as jest.Mock).mockRejectedValue(new Error("Print failed"));

    const { result } = renderHook(() => usePrintEntityLabel("item"));

    await act(async () => {
      await result.current(1, "Item");
    });

    expect(toast.error).toHaveBeenCalledWith("Print failed");
  });

  it("при неизвестной ошибке показывает PRINT_ERROR_MESSAGE", async () => {
    (printEntityLabel as jest.Mock).mockRejectedValue("unknown");

    const { result } = renderHook(() => usePrintEntityLabel("place"));

    await act(async () => {
      await result.current(1, "Shelf");
    });

    expect(toast.error).toHaveBeenCalledWith("Не удалось открыть окно печати");
  });
});
