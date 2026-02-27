import { renderHook, act } from "@testing-library/react";
import { useDebouncedSearch } from "@/lib/app/hooks/use-debounced-search";

describe("useDebouncedSearch", () => {
  it("не вызывает onSearch при первом монтировании и вызывает при изменении запроса", () => {
    jest.useFakeTimers();
    const onSearch = jest.fn();

    const { rerender } = renderHook(
      ({ query }) =>
        useDebouncedSearch(query, onSearch, { delay: 200, skipInitial: true }),
      {
        initialProps: { query: "" },
      }
    );

    // первое монтирование со skipInitial не триггерит поиск
    expect(onSearch).not.toHaveBeenCalled();

    // изменение запроса запускает отложенный поиск
    rerender({ query: "  hello  " });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onSearch).toHaveBeenCalledWith("hello");

    jest.useRealTimers();
  });

  it("не перезапускает поиск, если запрос не изменился", () => {
    jest.useFakeTimers();
    const onSearch = jest.fn();

    const { rerender } = renderHook(
      ({ query }) => useDebouncedSearch(query, onSearch),
      {
        initialProps: { query: "" },
      }
    );

    rerender({ query: "same" });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);

    // повторный ререндер с тем же значением не должен запускать новый поиск
    rerender({ query: "same" });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("передает пустую строку, если запрос состоит только из пробелов", () => {
    jest.useFakeTimers();
    const onSearch = jest.fn();

    const { rerender } = renderHook(
      ({ query }) =>
        useDebouncedSearch(query, onSearch, { delay: 100, skipInitial: false }),
      {
        initialProps: { query: "" },
      }
    );

    rerender({ query: "   " });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onSearch).toHaveBeenCalledWith("");

    jest.useRealTimers();
  });
});

