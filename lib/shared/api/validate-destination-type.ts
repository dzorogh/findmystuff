import { NextResponse } from "next/server";
import type { DestinationType } from "@/types/entity";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

/** Допустимые значения destination_type для переходов и создания сущностей с локацией. */
export const VALID_DESTINATION_TYPES: readonly DestinationType[] = [
  "room",
  "place",
  "container",
  "furniture",
] as const;

const VALID_SET = new Set<string>(VALID_DESTINATION_TYPES);

/**
 * Проверяет, что значение — допустимый DestinationType.
 * @param value — значение из body/query
 * @returns NextResponse с 400 при неверном значении, иначе приведённый DestinationType или null если значение не передано
 */
export function validateDestinationType(
  value: unknown
): NextResponse | DestinationType | null {
  if (value == null || value === "") return null;
  const s = typeof value === "string" ? value.trim() : String(value);
  if (!s) return null;
  if (VALID_SET.has(s)) return s as DestinationType;
  return NextResponse.json(
    {
      error: `Недопустимый destination_type. Допустимые значения: ${VALID_DESTINATION_TYPES.join(", ")}`,
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  );
}
