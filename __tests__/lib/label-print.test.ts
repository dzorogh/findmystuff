jest.mock("qrcode", () => ({
  toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,qr123"),
}));

import { printItemLabel, printEntityLabel } from "@/lib/entities/helpers/label-print";
import * as qrcode from "qrcode";

describe("label-print", () => {
  const mockWrite = jest.fn();
  let loadHandler: (() => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    loadHandler = null;
    const mockDoc = {
      open: jest.fn(),
      write: mockWrite,
      close: jest.fn(() => {
        loadHandler?.();
      }),
    };
    const mockContentWindow = {
      document: mockDoc,
      print: jest.fn(),
      focus: jest.fn(),
      onafterprint: null as (() => void) | null,
    };
    const mockIframe = {
      contentWindow: mockContentWindow,
      addEventListener: jest.fn((_event: string, handler: () => void) => {
        loadHandler = handler;
      }),
      remove: jest.fn(),
      parentNode: { removeChild: jest.fn() },
      setAttribute: jest.fn(),
    };
    document.createElement = jest.fn((tag: string) => {
      if (tag === "iframe") return mockIframe as unknown as HTMLIFrameElement;
      return document.createElement.bind(document)(tag);
    });
    document.body.appendChild = jest.fn();
  });

  it("генерирует QR с payload вида item:id и пишет HTML в iframe для печати", async () => {
    await printItemLabel(42, "Вещь");

    expect(qrcode.toDataURL).toHaveBeenCalledWith(
      "item:42",
      expect.objectContaining({
        width: 260,
        margin: 0,
        errorCorrectionLevel: "M",
      })
    );
    expect(document.createElement).toHaveBeenCalledWith("iframe");
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalledTimes(1);
    const html = mockWrite.mock.calls[0][0];
    expect(html).toContain("data:image/png;base64,qr123");
    expect(html).toContain("62mm");
    expect(html).toContain("29mm");
    expect(html).toContain("Вещь");
  });

  it("использует имя в этикетке", async () => {
    await printItemLabel(1, "Очень длинное название вещи больше двенадцати символов");

    const html = mockWrite.mock.calls[0][0];
    expect(html).toContain("label-title");
    expect(html).toContain("Очень длинное название вещи больше двенадцати символов");
  });

  it("использует #id при отсутствии имени", async () => {
    await printItemLabel(99, null);

    const html = mockWrite.mock.calls[0][0];
    expect(html).toContain("#99");
  });

  it("printEntityLabel генерирует QR с payload по типу сущности", async () => {
    await printEntityLabel("place", 10, "Склад");
    expect(qrcode.toDataURL).toHaveBeenCalledWith("place:10", expect.any(Object));
    const html = mockWrite.mock.calls[0][0];
    expect(html).toContain("place:10");
    expect(html).toContain("Склад");

    mockWrite.mockClear();
    await printEntityLabel("container", 5, "Коробка");
    expect(qrcode.toDataURL).toHaveBeenCalledWith("container:5", expect.any(Object));
    const html2 = mockWrite.mock.calls[0][0];
    expect(html2).toContain("container:5");

    mockWrite.mockClear();
    await printEntityLabel("room", 1, null);
    expect(qrcode.toDataURL).toHaveBeenCalledWith("room:1", expect.any(Object));
    const html3 = mockWrite.mock.calls[0][0];
    expect(html3).toContain("room:1");
    expect(html3).toContain("#1");
  });
});
