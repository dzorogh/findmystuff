/**
 * Единообразный ответ с ошибкой 500 для catch-блоков API.
 * Логирует ошибку с контекстом (только в development) и возвращает NextResponse с телом { error: string }.
 *
 * Конвенция API: во всех маршрутах app/api/* тело ответа с ошибкой — всегда { error: string } (не объект с message).
 * Доменные функции (getPlacesList, loadRoomDetail и т.д.) возвращают error как строку или { error: string, status }.
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "./http-status";
import { logError, logErrorOnly } from "@/lib/shared/logger";

const DEFAULT_MESSAGE = "Произошла ошибка";

export function apiErrorResponse(
  error: unknown,
  options?: { context?: string; defaultMessage?: string }
): NextResponse {
  const message =
    error instanceof Error ? error.message : options?.defaultMessage ?? DEFAULT_MESSAGE;
  const context = options?.context;
  if (context) {
    logError(context, error);
  } else {
    logErrorOnly(error);
  }
  return NextResponse.json(
    { error: message },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}
