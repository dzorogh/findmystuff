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

export type ContainerType = string;

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

/**
 * Генерирует маркировку контейнера по шаблону
 * @param containerType - тип контейнера
 * @param markingNumber - номер маркировки
 * @param template - шаблон маркировки (по умолчанию "{TYPE}-{NUMBER}")
 */
export const generateContainerMarking = (
  containerType: ContainerType | null | undefined,
  markingNumber: number | null | undefined,
  template: string = "{TYPE}-{NUMBER}"
): string | null => {
  if (!containerType || !markingNumber) {
    return null;
  }

  try {
    let result = template;
    
    // Заменяем {TYPE} на тип контейнера
    result = result.replace(/{TYPE}/g, containerType);
    
    // Обрабатываем {NUMBER} с указанием ширины (например, {NUMBER:2} или {NUMBER:4})
    result = result.replace(/{NUMBER:(\d+)}/g, (_, width) => {
      return String(markingNumber).padStart(parseInt(width), "0");
    });
    
    // Заменяем обычный {NUMBER} на номер с шириной 3 по умолчанию
    result = result.replace(/{NUMBER}/g, String(markingNumber).padStart(3, "0"));
    
    return result;
  } catch {
    // В случае ошибки возвращаем простой формат
    return `${containerType}-${String(markingNumber).padStart(3, "0")}`;
  }
};
