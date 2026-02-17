import { LayoutGrid, Sofa } from "lucide-react";
import AddFurnitureForm from "@/components/forms/add-furniture-form";
import { getFurniture } from "@/lib/furniture/api";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  Filters,
} from "@/lib/app/types/entity-config";
import type { Furniture } from "@/types/entity";
import { useFurnitureActions } from "@/lib/entities/furniture/use-furniture-actions";

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

function useFurnitureConfigActions(params: { refreshList: () => void }) {
  const getRowActions = useFurnitureActions({
    refreshList: params.refreshList,
    basePath: furnitureEntityConfig.basePath,
    apiTable: furnitureEntityConfig.apiTable,
    labels: furnitureEntityConfig.labels,
  });
  return (entity: EntityDisplay) => getRowActions(entity as Furniture);
}

export const furnitureEntityConfig: EntityConfig = {
  kind: "furniture",
  basePath: "/furniture",
  apiTable: "furniture",
  labels: {
    singular: "Мебель",
    plural: "Мебель",
    results: { one: "мебель", few: "мебели", many: "мебели" },
    moveTitle: "Переместить мебель",
    moveSuccess: (destinationName) => `Мебель успешно перемещена в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении мебели",
    deleteConfirm: "Вы уверены, что хотите удалить эту мебель?",
    deleteSuccess: "Мебель успешно удалена",
    restoreSuccess: "Мебель успешно восстановлена",
    duplicateSuccess: "Мебель успешно дублирована",
  },
  actions: {
    actions: ["edit", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
  },
  useActions: useFurnitureConfigActions,
  addForm: {
    title: "Добавить мебель",
    form: AddFurnitureForm,
  },
  getName: (entity) =>
    entity.name != null && entity.name.trim() !== "" ? entity.name : `Мебель #${entity.id}`,
  icon: Sofa,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удалённую мебель" },
      { type: "room", key: "roomId" },
    ],
    initial: DEFAULT_FURNITURE_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "room", label: "Помещение" },
    { key: "counts", label: "Содержимое" },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchFurniture,
  counts: {
    filterParam: "furnitureId",
    links: [
      { path: "/places", field: "places_count", icon: LayoutGrid, label: "мест" },
    ],
  },
  groupBy: (entity) => {
    const furniture = entity as Furniture;
    const name = furniture.room_name?.trim();
    return name && name.length > 0 ? name : null;
  },
  groupByEmptyLabel: "Без помещения",
};
