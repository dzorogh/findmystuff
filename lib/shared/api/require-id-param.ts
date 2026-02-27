/**
 * Обёртка для извлечения числового id из params маршрута [id].
 * Упрощает повторяющийся код: resolve params → parseId → return error или id.
 */

import { NextResponse } from "next/server";
import { parseId } from "./parse-id";

type RouteParams = Promise<{ id: string }> | { id: string };

type RequireIdParamOptions = {
  /** Подпись сущности для сообщения об ошибке (например "вещи" → "Неверный ID вещи"). */
  entityLabel?: string;
  /** Имя параметра (по умолчанию "id"). */
  paramName?: string;
};

/**
 * Разрешает params (sync или Promise), парсит id и возвращает { id } или NextResponse 400.
 * Использование в [id]-маршрутах:
 *   const idResult = await requireIdParam(params, { entityLabel: "вещи" });
 *   if (idResult instanceof NextResponse) return idResult;
 *   const id = idResult.id;
 */
export async function requireIdParam(
  params: RouteParams,
  options?: RequireIdParamOptions
): Promise<{ id: number } | NextResponse> {
  const resolved = await Promise.resolve(params);
  const idString = resolved?.id;
  return parseId(idString, {
    entityLabel: options?.entityLabel,
    paramName: options?.paramName,
  });
}

