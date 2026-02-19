import { Copy, DoorOpen, Home, Pencil, Printer, RotateCcw, Trash2 } from "lucide-react";
import AddBuildingForm from "@/components/forms/add-building-form";
import { getBuildings } from "@/lib/buildings/api";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  Filters,
} from "@/lib/app/types/entity-config";

export interface BuildingsFilters extends Filters {
  showDeleted: boolean;
}

export const DEFAULT_BUILDINGS_FILTERS: BuildingsFilters = {
  showDeleted: false,
};

async function fetchBuildings(params: FetchListParams): Promise<FetchListResult> {
  const { query, filterValues, sortBy, sortDirection } = params;
  const filters = filterValues as BuildingsFilters;
  const response = await getBuildings({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    sortBy,
    sortDirection,
  });
  const list = Array.isArray(response?.data) ? response.data : [];
  const totalCount = response?.totalCount ?? list.length;
  return { data: list, totalCount };
}

const BASE_PATH = "/buildings";

export const buildingsEntityConfig: EntityConfig = {
  kind: "building" as const,
  basePath: BASE_PATH,
  apiTable: "buildings" as const,
  labels: {
    singular: "Здание",
    plural: "Здания",
    results: { one: "здание", few: "здания", many: "зданий" },
    moveTitle: "Переместить здание",
    moveSuccess: (destinationName: string) => `Здание успешно перемещено в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении здания",
    deleteConfirm: "Вы уверены, что хотите удалить это здание?",
    deleteSuccess: "Здание успешно удалено",
    restoreSuccess: "Здание успешно восстановлено",
    duplicateSuccess: "Здание успешно дублировано",
  },
  addForm: {
    title: "Добавить здание",
    form: AddBuildingForm,
  },
  getName: (entity: EntityDisplay) =>
    entity.name != null && entity.name.trim() !== "" ? entity.name : `Здание #${entity.id}`,
  icon: Home,
  filters: {
    fields: [{ type: "showDeleted" as const, label: "Показывать удалённые здания" }],
    initial: DEFAULT_BUILDINGS_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "counts", label: "Содержимое", hideOnMobile: true },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchBuildings,
  counts: {
    filterParam: "buildingId",
    links: [
      { path: "/rooms", field: "rooms_count", icon: DoorOpen, label: "пом." },
    ],
  },
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
