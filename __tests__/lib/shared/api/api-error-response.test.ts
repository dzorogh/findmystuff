jest.mock("next/server");

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";

describe("apiErrorResponse", () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("логирует ошибку с контекстом и возвращает 500 с message из Error", async () => {
    const error = new Error("boom");

    const res = apiErrorResponse(error, {
      context: "ctx:",
      defaultMessage: "default",
    });

    expect(console.error).toHaveBeenCalledWith("ctx:", error);
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const body = await res.json();
    expect(body).toEqual({ error: "boom" });
  });

  it("использует defaultMessage для не Error", async () => {
    const res = apiErrorResponse("oops", {
      defaultMessage: "fallback",
    });

    expect(console.error).toHaveBeenCalledWith("oops");
    expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const body = await res.json();
    expect(body).toEqual({ error: "fallback" });
  });

  it("использует дефолтное сообщение без options", async () => {
    const res = apiErrorResponse("oops");

    expect(console.error).toHaveBeenCalledWith("oops");
    const body = await res.json();
    expect(body).toEqual({ error: "Произошла ошибка" });
  });
});

