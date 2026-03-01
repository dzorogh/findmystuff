/**
 * Парсит строку query-параметра в boolean или null.
 * "true" → true, "false" → false, пустая строка / отсутствие → null.
 * Используется для опциональных фильтров (hasItems, showDeleted и т.д.).
 */
export function parseOptionalBool(value: string | null | undefined): boolean | null {
  if (value == null || value === "") return null;
  const lower = value.trim().toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  return null;
}
