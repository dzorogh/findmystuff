/**
 * Парсит строку в целое число. Возвращает null для пустой строки или нечислового значения.
 * Используется для опциональных query-параметров (roomId, placeId, entityTypeId и т.д.).
 */
export function parseOptionalInt(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}
