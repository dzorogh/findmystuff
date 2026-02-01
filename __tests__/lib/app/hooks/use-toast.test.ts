import { renderHook, act } from "@testing-library/react";
import { useToast, toast } from "@/lib/app/hooks/use-toast";

describe("useToast", () => {
  it("возвращает toasts и функции toast, dismiss", () => {
    const { result } = renderHook(() => useToast());

    expect(result.current).toHaveProperty("toasts");
    expect(Array.isArray(result.current.toasts)).toBe(true);
    expect(result.current).toHaveProperty("toast");
    expect(typeof result.current.toast).toBe("function");
    expect(result.current).toHaveProperty("dismiss");
    expect(typeof result.current.dismiss).toBe("function");
  });

  it("toast добавляет тост и возвращает id и dismiss", () => {
    const { result } = renderHook(() => useToast());

    let toastReturn: { id: string; dismiss: () => void };
    act(() => {
      toastReturn = result.current.toast({ title: "Test" });
    });

    expect(toastReturn!).toHaveProperty("id");
    expect(toastReturn!).toHaveProperty("dismiss");
    expect(typeof toastReturn!.dismiss).toBe("function");
  });

  it("dismiss с id закрывает один тост", () => {
    const { result } = renderHook(() => useToast());

    let id: string;
    act(() => {
      const ret = result.current.toast({ title: "A" });
      id = ret.id;
    });

    expect(result.current.toasts.length).toBe(1);

    act(() => {
      result.current.dismiss(id);
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].open).toBe(false);
  });

  it("dismiss без id закрывает все тосты", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "A" });
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts.every((t) => !t.open)).toBe(true);
  });

  it("toast.update обновляет тост", () => {
    const { result } = renderHook(() => useToast());

    let toastReturn: { id: string; update: (p: { title: string }) => void };
    act(() => {
      toastReturn = result.current.toast({ title: "Original" });
    });

    act(() => {
      toastReturn!.update({ title: "Updated" });
    });

    expect(result.current.toasts[0].title).toBe("Updated");
  });
});

describe("toast", () => {
  it("вызывается без ошибок", () => {
    expect(() => {
      toast({ title: "Title", description: "Description" });
    }).not.toThrow();
  });
});
