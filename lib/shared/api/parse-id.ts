/**
 * Парсинг числового id из параметров маршрута.
 * Возвращает результат или NextResponse 400 с единообразным сообщением.
 */

import { NextResponse } from "next/server";
import { HTTP_STATUS } from "./http-status";

const DEFAULT_PARAM_NAME = "id";

/**
 * Парсит строку в число. Возвращает { id } или NextResponse с 400.
 * @param idString — значение из params (например params.id)
 * @param paramName — имя параметра для сообщения об ошибке (по умолчанию "id")
 * @param entityLabel — подпись сущности для сообщения (например "вещи" → "Неверный ID вещи")
 */
export function parseId(
  idString: string | undefined,
  options?: { paramName?: string; entityLabel?: string }
): { id: number } | NextResponse {
  const paramName = options?.paramName ?? DEFAULT_PARAM_NAME;
  const entityLabel = options?.entityLabel ?? "сущности";
  if (idString == null || idString === "") {
    return NextResponse.json(
      { error: `Не указан ${paramName}` },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
  const id = parseInt(idString, 10);
  if (Number.isNaN(id) || id <= 0) {
    return NextResponse.json(
      { error: `Неверный ID ${entityLabel}` },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
  return { id };
}
