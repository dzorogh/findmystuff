import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Типы контейнеров для маркировки
export const CONTAINER_TYPES = [
  { value: "КОР", label: "КОР - Коробка" },
  { value: "ПЛА", label: "ПЛА - Пластик" },
  { value: "ЯЩ", label: "ЯЩ - Ящик" },
  { value: "МЕТ", label: "МЕТ - Металл" },
  { value: "СУМ", label: "СУМ - Сумка" },
  { value: "ПАК", label: "ПАК - Пакет" },
  { value: "ДРУ", label: "ДРУ - Другое" },
] as const;

export type ContainerType = typeof CONTAINER_TYPES[number]["value"];

/**
 * Генерирует маркировку контейнера в формате ТИП-НОМЕР (например, КОР-001)
 */
export const generateContainerMarking = (
  containerType: ContainerType | null | undefined,
  markingNumber: number | null | undefined
): string | null => {
  if (!containerType || !markingNumber) {
    return null;
  }
  return `${containerType}-${String(markingNumber).padStart(3, "0")}`;
};
