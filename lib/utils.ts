import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Типы контейнеров для маркировки (значения по умолчанию, если настройки не загружены)
export const DEFAULT_CONTAINER_TYPES = [
  { value: "КОР", label: "КОР - Коробка" },
  { value: "ПЛА", label: "ПЛА - Пластик" },
  { value: "ЯЩ", label: "ЯЩ - Ящик" },
  { value: "МЕТ", label: "МЕТ - Металл" },
  { value: "СУМ", label: "СУМ - Сумка" },
  { value: "ПАК", label: "ПАК - Пакет" },
  { value: "ДРУ", label: "ДРУ - Другое" },
] as const;

/**
 * Преобразует массив типов контейнеров в формат для select
 */
export const containerTypesToOptions = (types: string[]) => {
  return types.map((type) => ({
    value: type,
    label: `${type} - ${getContainerTypeLabel(type)}`,
  }));
};

/**
 * Преобразует массив типов мест в формат для select
 */
export const placeTypesToOptions = (types: string[]) => {
  return types.map((type) => ({
    value: type,
    label: type,
  }));
};

/**
 * Возвращает читаемое название типа контейнера
 */
const getContainerTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    КОР: "Коробка",
    ПЛА: "Пластик",
    ЯЩ: "Ящик",
    МЕТ: "Металл",
    СУМ: "Сумка",
    ПАК: "Пакет",
    ДРУ: "Другое",
  };
  return labels[type] || type;
};
