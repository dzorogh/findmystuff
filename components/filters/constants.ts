/** Общие опции типа местоположения для фильтров (вещи, контейнеры). */
export const LOCATION_TYPE_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "room", label: "Помещение" },
  { value: "place", label: "Место" },
  { value: "container", label: "Контейнер" },
] as const;

export type LocationTypeFilterValue =
  (typeof LOCATION_TYPE_OPTIONS)[number]["value"];

export const FILTER_RESET_LABEL = "Сбросить фильтры";

/** Тексты для Combobox в фильтрах (общие). */
export const FILTER_COMBOBOX_DEFAULT = {
  placeholder: "Выберите...",
  searchPlaceholder: "Поиск...",
  emptyText: "Не найдено",
} as const;

export const FILTER_COMBOBOX_TYPE = {
  placeholder: "Выберите тип...",
  searchPlaceholder: "Поиск типа...",
  emptyText: "Типы не найдены",
} as const;

export const FILTER_COMBOBOX_ROOM = {
  placeholder: "Выберите помещение...",
  searchPlaceholder: "Поиск помещения...",
  emptyText: "Помещения не найдены",
} as const;

/** Класс для скелетона поля в панели фильтров. */
export const FILTER_FIELD_SKELETON_CLASS = "h-10 w-full";

/** Обновление только showDeleted в объекте фильтров (убирает дублирование в панелях). */
export function mergeShowDeleted<T extends { showDeleted: boolean }>(
  filters: T,
  showDeleted: boolean
): T {
  return { ...filters, showDeleted };
}
