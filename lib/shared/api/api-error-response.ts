/**
 * Единообразный ответ с ошибкой 500 для catch-блоков API.
 * Логирует ошибку с контекстом и возвращает NextResponse с телом { error: string }.
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "./http-status";

const DEFAULT_MESSAGE = "Произошла ошибка";

export function apiErrorResponse(
  error: unknown,
  options?: { context?: string; defaultMessage?: string }
): NextResponse {
  const message =
    error instanceof Error ? error.message : options?.defaultMessage ?? DEFAULT_MESSAGE;
  const context = options?.context;
  if (context) {
    console.error(context, error);
  } else {
    console.error(error);
  }
  return NextResponse.json(
    { error: message },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}
