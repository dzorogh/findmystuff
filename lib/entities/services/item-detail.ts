/**
 * Сервис загрузки данных страницы детали вещи (item).
 * Чистые функции работы с API, без React-зависимостей.
 */

import { getItem, getItemTransitions } from "@/lib/entities/api";
import type { Item, Transition } from "@/types/entity";

const ITEM_NOT_FOUND_MESSAGE = "Вещь не найдена";

/**
 * Загружает основную информацию о вещи (без истории перемещений).
 * @param tenantId — активный тенант (передавать с клиента для заголовка x-tenant-id)
 * @throws Error при ошибке API или отсутствии данных
 */
export const fetchItemById = async (
  itemId: number,
  tenantId?: number | null
): Promise<Item> => {
  const response = await getItem(itemId, tenantId);
  const resWithDebug = response as { error?: string; data?: Item | { data: Item }; debug?: { itemId: number; tenantId: number } };

  if (resWithDebug.error) {
    const message =
      process.env.NODE_ENV === "development" && resWithDebug.debug
        ? `${resWithDebug.error} (server debug: itemId=${resWithDebug.debug.itemId} tenantId=${resWithDebug.debug.tenantId})`
        : resWithDebug.error;
    throw new Error(message);
  }

  const raw = resWithDebug.data;
  const item =
    raw != null && typeof raw === "object" && "data" in raw && (raw as { data: Item }).data != null
      ? (raw as { data: Item }).data
      : (raw as Item | undefined);
  if (!item || (typeof item === "object" && !("id" in item))) {
    const message =
      process.env.NODE_ENV === "development" && resWithDebug.debug
        ? `${ITEM_NOT_FOUND_MESSAGE} (server: itemId=${resWithDebug.debug.itemId} tenantId=${resWithDebug.debug.tenantId})`
        : ITEM_NOT_FOUND_MESSAGE;
    throw new Error(message);
  }
  return item;
};

/**
 * Загружает историю перемещений вещи.
 * @param tenantId — активный тенант (передавать с клиента для заголовка x-tenant-id)
 * При ошибке API возвращает пустой массив (не бросает).
 */
export const fetchItemTransitions = async (
  itemId: number,
  tenantId?: number | null
): Promise<Transition[]> => {
  try {
    const response = await getItemTransitions(itemId, tenantId);
    if (response.error) return [];
    return response.data ?? [];
  } catch {
    return [];
  }
};
