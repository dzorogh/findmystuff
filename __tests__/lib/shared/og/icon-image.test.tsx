import { createIconResponse } from "@/lib/shared/og/icon-image";

jest.mock("next/og", () => ({
  ImageResponse: jest.fn(function MockImageResponse() {
    return {};
  }),
}));

describe("icon-image", () => {
  it("createIconResponse вызывает ImageResponse с size", () => {
    createIconResponse({ width: 32, height: 32 });
    const { ImageResponse } = require("next/og");
    expect(ImageResponse).toHaveBeenCalledWith(expect.anything(), { width: 32, height: 32 });
  });

  it("createIconResponse с theme dark покрывает ветку dark", () => {
    createIconResponse({ width: 32, height: 32 }, "dark");
    const { ImageResponse } = require("next/og");
    expect(ImageResponse).toHaveBeenCalled();
  });
});
