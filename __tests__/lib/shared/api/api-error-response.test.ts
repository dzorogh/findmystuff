jest.mock("next/server");
jest.mock("@/lib/shared/logger", () => ({
  logError: jest.fn(),
  logErrorOnly: jest.fn(),
}));

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { logError, logErrorOnly } from "@/lib/shared/logger";

describe("apiErrorResponse", () => {
  beforeEach(() => {
    jest.mocked(logError).mockClear();
    jest.mocked(logErrorOnly).mockClear();
  });

  it("вызывает logError с контекстом и возвращает 500 с message из Error", async () => {
    const error = new Error("boom");

    const res = apiErrorResponse(error, {
      context: "ctx:",
      defaultMessage: "default",
    });

    expect(logError).toHaveBeenCalledWith("ctx:", error);
    expect(logErrorOnly).not.toHaveBeenCalled();
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const body = await res.json();
    expect(body).toEqual({ error: "boom" });
  });

  it("использует defaultMessage для не Error", async () => {
    const res = apiErrorResponse("oops", {
      defaultMessage: "fallback",
    });

    expect(logErrorOnly).toHaveBeenCalledWith("oops");
    expect(logError).not.toHaveBeenCalled();
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const body = await res.json();
    expect(body).toEqual({ error: "fallback" });
  });

  it("использует дефолтное сообщение без options", async () => {
    const res = apiErrorResponse("oops");

    expect(logErrorOnly).toHaveBeenCalledWith("oops");
    const body = await res.json();
    expect(body).toEqual({ error: "Произошла ошибка" });
  });
});

