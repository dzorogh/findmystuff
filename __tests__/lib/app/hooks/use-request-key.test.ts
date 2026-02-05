import { renderHook, act } from "@testing-library/react";
import { useRequestKey } from "@/lib/app/hooks/use-request-key";

describe("useRequestKey", () => {
  it("shouldStart возвращает true для нового ключа", () => {
    const { result } = renderHook(() => useRequestKey());

    expect(result.current.shouldStart("key1")).toBe(true);
  });

  it("shouldStart возвращает false для того же ключа пока запрос не завершён", () => {
    const { result } = renderHook(() => useRequestKey());

    act(() => {
      result.current.shouldStart("key1");
    });
    expect(result.current.shouldStart("key1")).toBe(false);
  });

  it("shouldStart возвращает true для другого ключа", () => {
    const { result } = renderHook(() => useRequestKey());

    act(() => {
      result.current.shouldStart("key1");
    });
    expect(result.current.shouldStart("key2")).toBe(true);
  });

  it("isLatest возвращает true только для текущего ключа", () => {
    const { result } = renderHook(() => useRequestKey());

    act(() => {
      result.current.shouldStart("key1");
    });
    expect(result.current.isLatest("key1")).toBe(true);
    expect(result.current.isLatest("key2")).toBe(false);
  });

  it("finish с тем же ключом сбрасывает состояние", () => {
    const { result } = renderHook(() => useRequestKey());

    act(() => {
      result.current.shouldStart("key1");
    });
    expect(result.current.isLatest("key1")).toBe(true);

    act(() => {
      result.current.finish("key1");
    });
    expect(result.current.isLatest("key1")).toBe(false);
    expect(result.current.shouldStart("key1")).toBe(true);
  });

  it("finish с другим ключом не сбрасывает состояние", () => {
    const { result } = renderHook(() => useRequestKey());

    act(() => {
      result.current.shouldStart("key1");
    });
    act(() => {
      result.current.finish("key2");
    });
    expect(result.current.isLatest("key1")).toBe(true);
    expect(result.current.shouldStart("key1")).toBe(false);
  });
});
