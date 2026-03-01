import { NextResponse } from "next/server";
import type { EntityTypeName } from "@/types/entity";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

/** Допустимые значения entity_category для типов сущностей. */
export const VALID_ENTITY_CATEGORIES: readonly EntityTypeName[] = [
  "place",
  "container",
  "room",
  "item",
  "building",
  "furniture",
] as const;

const VALID_SET = new Set<string>(VALID_ENTITY_CATEGORIES);

/**
 * Проверяет, что значение — допустимый EntityTypeName (entity_category).
 * @param value — значение из body/query
 * @returns NextResponse с 400 при неверном значении, иначе приведённый EntityTypeName или null если значение не передано
 */
export function validateEntityCategory(
  value: unknown
): NextResponse | EntityTypeName | null {
  if (value == null || value === "") return null;
  const s = typeof value === "string" ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
  if (!s) return null;
  if (VALID_SET.has(s)) return s as EntityTypeName;
  return NextResponse.json(
    {
      error: `entity_category должен быть одним из: ${VALID_ENTITY_CATEGORIES.join(", ")}`,
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  );
}
