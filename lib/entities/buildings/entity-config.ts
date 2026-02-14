import { Home } from "lucide-react";
import AddBuildingForm from "@/components/forms/add-building-form";
import { getBuildings } from "@/lib/buildings/api";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  Filters,
} from "@/lib/app/types/entity-config";
import type { Building } from "@/types/entity";
import { useBuildingsActions } from "@/lib/entities/buildings/use-buildings-actions";

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

function useBuildingsConfigActions(params: { refreshList: () => void }) {
  const getRowActions = useBuildingsActions({
    refreshList: params.refreshList,
    basePath: buildingsEntityConfig.basePath,
    apiTable: buildingsEntityConfig.apiTable,
    labels: buildingsEntityConfig.labels,
  });
  return (entity: EntityDisplay) => getRowActions(entity as Building);
}

export const buildingsEntityConfig: EntityConfig = {
  kind: "building",
  basePath: "/buildings",
  apiTable: "buildings",
  labels: {
    singular: "Здание",
    plural: "Здания",
    results: { one: "здание", few: "здания", many: "зданий" },
    moveTitle: "Переместить здание",
    moveSuccess: (destinationName) => `Здание успешно перемещено в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении здания",
    deleteConfirm: "Вы уверены, что хотите удалить это здание?",
    deleteSuccess: "Здание успешно удалено",
    restoreSuccess: "Здание успешно восстановлено",
    duplicateSuccess: "Здание успешно дублировано",
  },
  actions: {
    actions: ["edit", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
  },
  useActions: useBuildingsConfigActions,
  addForm: {
    title: "Добавить здание",
    form: AddBuildingForm,
  },
  getName: (entity) =>
    entity.name != null && entity.name.trim() !== "" ? entity.name : `Здание #${entity.id}`,
  icon: Home,
  filters: {
    fields: [{ type: "showDeleted", label: "Показывать удалённые здания" }],
    initial: DEFAULT_BUILDINGS_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "counts", label: "Содержимое" },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchBuildings,
};
