import { printEntityLabel } from "@/lib/entities/helpers/label-print";

describe("label-print", () => {
  const openMock = jest.spyOn(window, "open");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-02-03T10:20:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("printEntityLabel открывает страницу печати через API endpoint", async () => {
    const focus = jest.fn();
    openMock.mockReturnValue({ focus } as unknown as Window);

    await printEntityLabel("place", 10, "Склад A");

    expect(openMock).toHaveBeenCalledTimes(1);
    const [url, target] = openMock.mock.calls[0];
    expect(target).toBe("_blank");

    const parsed = new URL(String(url), "http://localhost");
    expect(parsed.pathname).toBe("/api/print/label");
    expect(parsed.searchParams.get("entityType")).toBe("place");
    expect(parsed.searchParams.get("entityId")).toBe("10");
    expect(parsed.searchParams.get("name")).toBe("Склад A");
    expect(parsed.searchParams.get("createdAt")).toBeTruthy();
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("printEntityLabel не добавляет пустое имя в URL", async () => {
    const focus = jest.fn();
    openMock.mockReturnValue({ focus } as unknown as Window);

    await printEntityLabel("room", 1, "   ");

    const [url] = openMock.mock.calls[0];
    const parsed = new URL(String(url), "http://localhost");
    expect(parsed.searchParams.get("name")).toBeNull();
  });

  it("printEntityLabel бросает ошибку, если popup заблокирован", async () => {
    openMock.mockReturnValue(null);

    await expect(printEntityLabel("container", 5, "Коробка")).rejects.toThrow(
      "Браузер заблокировал окно печати. Разрешите всплывающие окна и попробуйте снова."
    );
  });
});
