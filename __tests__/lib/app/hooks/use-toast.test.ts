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
});

describe("toast", () => {
  it("вызывается без ошибок", () => {
    expect(() => {
      toast({ title: "Title", description: "Description" });
    }).not.toThrow();
  });
});
