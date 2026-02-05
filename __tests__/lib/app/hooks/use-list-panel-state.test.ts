import { renderHook, act } from "@testing-library/react";
import { useListPanelState } from "@/lib/app/hooks/use-list-panel-state";

describe("useListPanelState", () => {
  it("по умолчанию isOpen false и setIsOpen обновляет внутреннее состояние", () => {
    const { result } = renderHook(() => useListPanelState());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("при externalOpen isOpen берётся из пропа", () => {
    const { result } = renderHook(() => useListPanelState(true));

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(true);
  });

  it("setIsOpen всегда вызывает onOpenChange", () => {
    const onOpenChange = jest.fn();
    const { result } = renderHook(() => useListPanelState(undefined, onOpenChange));

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(onOpenChange).toHaveBeenCalledWith(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("при externalOpen undefined и onOpenChange вызывается с новым значением", () => {
    const onOpenChange = jest.fn();
    const { result } = renderHook(() => useListPanelState(undefined, onOpenChange));

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
