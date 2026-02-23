/**
 * Сервис загрузки данных страницы детали вещи (item).
 * Чистые функции работы с API, без React-зависимостей.
 */

import { getItem, getItemTransitions } from "@/lib/entities/api";
import type { Item, Transition } from "@/types/entity";

const ITEM_NOT_FOUND_MESSAGE = "Вещь не найдена";

/**
 * Загружает основную информацию о вещи (без истории перемещений).
 * @throws Error при ошибке API или отсутствии данных
 */
export const fetchItemById = async (itemId: number): Promise<Item> => {
  const response = await getItem(itemId);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data?.item) {
    throw new Error(ITEM_NOT_FOUND_MESSAGE);
  }

  return response.data.item;
};

/**
 * Загружает историю перемещений вещи.
 * При ошибке API возвращает пустой массив (не бросает).
 */
export const fetchItemTransitions = async (itemId: number): Promise<Transition[]> => {
  try {
    const response = await getItemTransitions(itemId);
    if (response.error) return [];
    return response.data ?? [];
  } catch {
    return [];
  }
};
