import { Copy, LayoutGrid, Pencil, Printer, RotateCcw, Sofa, Trash2 } from "lucide-react";
import AddFurnitureForm from "@/components/forms/add-furniture-form";
import { getFurniture } from "@/lib/furniture/api";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  FilterFieldConfig,
  Filters,
} from "@/lib/app/types/entity-config";
import type { Furniture } from "@/types/entity";

export interface FurnitureFilters extends Filters {
  showDeleted: boolean;
  roomId: number | null;
}

export const DEFAULT_FURNITURE_FILTERS: FurnitureFilters = {
  showDeleted: false,
  roomId: null,
};

async function fetchFurniture(params: FetchListParams): Promise<FetchListResult> {
  const { query, filterValues, sortBy, sortDirection } = params;
  const filters = filterValues as FurnitureFilters;
  const response = await getFurniture({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    sortBy,
    sortDirection,
    roomId: filters.roomId ?? undefined,
  });
  const list = Array.isArray(response?.data) ? response.data : [];
  const totalCount = response?.totalCount ?? list.length;
  return { data: list, totalCount };
}

const BASE_PATH = "/furniture";

export const furnitureEntityConfig: EntityConfig = {
  kind: "furniture" as const,
  basePath: BASE_PATH,
  apiTable: "furniture" as const,
  labels: {
    singular: "Мебель",
    plural: "Мебель",
    results: { one: "мебель", few: "мебели", many: "мебели" },
    moveTitle: "Переместить мебель",
    moveSuccess: (destinationName: string) =>
      `Мебель успешно перемещена в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении мебели",
    deleteConfirm: "Вы уверены, что хотите удалить эту мебель?",
    deleteSuccess: "Мебель успешно удалена",
    restoreSuccess: "Мебель успешно восстановлена",
    duplicateSuccess: "Мебель успешно дублирована",
  },
  addForm: {
    title: "Добавить мебель",
    form: AddFurnitureForm,
  },
  getName: (entity: EntityDisplay) =>
    entity.name != null && entity.name.trim() !== ""
      ? entity.name
      : `Мебель #${entity.id}`,
  icon: Sofa,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удалённую мебель" },
      { type: "room", key: "roomId" },
    ] satisfies FilterFieldConfig[],
    initial: DEFAULT_FURNITURE_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "room", label: "Помещение", hideOnMobile: true },
    { key: "counts", label: "Содержимое", hideOnMobile: true },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchFurniture,
  counts: {
    filterParam: "furnitureId",
    links: [
      { path: "/places", field: "places_count", icon: LayoutGrid, label: "мест" },
    ],
  },
  groupBy: (entity: EntityDisplay) => {
    const furniture = entity as Furniture;
    const name = furniture.room_name?.trim();
    return name && name.length > 0 ? name : null;
  },
  groupByEmptyLabel: "Без помещения",
  actions: {
    whenActive: [
      { key: "edit", label: "Редактировать", icon: Pencil, getHref: (e) => `${BASE_PATH}/${e.id}` },
      { key: "printLabel", label: "Печать этикетки", icon: Printer, getOnClick: (e, ctx) => () => ctx.printLabel?.(e.id, e.name) },
      { key: "duplicate", label: "Дублировать", icon: Copy, getOnClick: (e, ctx) => () => ctx.handleDuplicate?.(e.id) },
      { key: "delete", label: "Удалить", icon: Trash2, variant: "destructive", getOnClick: (e, ctx) => () => ctx.handleDelete?.(e.id) },
    ],
    whenDeleted: [
      { key: "restore", label: "Восстановить", icon: RotateCcw, getOnClick: (e, ctx) => () => ctx.handleRestore?.(e.id) },
    ],
  },
};
