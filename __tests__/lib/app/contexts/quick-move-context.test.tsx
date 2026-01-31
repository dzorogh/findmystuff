import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
  QuickMoveProvider,
  useQuickMove,
} from "@/lib/app/contexts/quick-move-context";

jest.mock("@/components/quick-move/quick-move-dialog", () => ({
  __esModule: true,
  default: ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => (
    <div data-testid="quick-move-dialog">
      <span data-testid="dialog-open">{String(open)}</span>
      <button type="button" onClick={() => onOpenChange(false)} aria-label="close" />
    </div>
  ),
}));

const Consumer = () => {
  const { open, setOpen } = useQuickMove();
  return (
    <div>
      <span data-testid="open">{String(open)}</span>
      <button type="button" onClick={() => setOpen(true)} aria-label="open" />
    </div>
  );
};

describe("QuickMoveContext", () => {
  it("предоставляет open и setOpen", () => {
    render(
      <QuickMoveProvider>
        <Consumer />
      </QuickMoveProvider>
    );

    expect(screen.getByTestId("open")).toHaveTextContent("false");
  });

  it("setOpen обновляет open", () => {
    render(
      <QuickMoveProvider>
        <Consumer />
      </QuickMoveProvider>
    );

    act(() => {
      screen.getByLabelText("open").click();
    });

    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("useQuickMove выбрасывает ошибку вне провайдера", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<Consumer />);
    }).toThrow("useQuickMove must be used within a QuickMoveProvider");

    consoleSpy.mockRestore();
  });
});
