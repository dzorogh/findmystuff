import type { EntityDisplay, FetchListResult } from "@/types/entity";

/**
 * Нормализует ответ API списка в FetchListResult.
 * Убирает дублирование разбора response?.data и формирования объекта результата.
 * totalCount подставляется из ответа или как длина массива data.
 */
export function createFetchListResult<T = EntityDisplay>(
  response: { data?: T[] | null; totalCount?: number } | null | undefined
): FetchListResult {
  const data = Array.isArray(response?.data) ? (response.data as EntityDisplay[]) : [];
  const totalCount = response?.totalCount ?? data.length;
  return { data, totalCount };
}
