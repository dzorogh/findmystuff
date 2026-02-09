import { Package } from "lucide-react";
import AddItemForm from "@/components/forms/add-item-form";
import { getItems } from "@/lib/entities/api";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  Filters,
} from "@/lib/app/types/entity-config";
import { useItemsActions } from "@/lib/entities/items/use-items-actions";
import type { Item } from "@/types/entity";

export interface ItemsFilters extends Filters {
  showDeleted: boolean;
  locationType: "all" | "room" | "place" | "container" | null;
  hasPhoto: boolean | null;
  roomId: number | null;
}

export const DEFAULT_ITEMS_FILTERS: ItemsFilters = {
  showDeleted: false,
  locationType: null,
  hasPhoto: null,
  roomId: null,
};

const ITEMS_PAGE_SIZE = 20;

async function fetchItems(params: FetchListParams): Promise<FetchListResult> {
  const { query, filterValues, sortBy, sortDirection, page = 1 } = params;
  const filters = filterValues as ItemsFilters;
  const response = await getItems({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    page,
    limit: ITEMS_PAGE_SIZE,
    locationType: filters.locationType,
    roomId: filters.roomId,
    hasPhoto: filters.hasPhoto,
    sortBy,
    sortDirection,
  });
  const data = Array.isArray(response?.data) ? response.data : [];
  return { data, totalCount: response?.totalCount ?? 0 };
}

function useItemsConfigActions(params: { refreshList: () => void }) {
  const getRowActions = useItemsActions({
    refreshList: params.refreshList,
    basePath: itemsEntityConfig.basePath,
    labels: itemsEntityConfig.labels,
    move: itemsEntityConfig.actions.move,
  });
  return (entity: EntityDisplay) => getRowActions(entity as Item);
}

export const itemsEntityConfig: EntityConfig = {
  kind: "item",
  basePath: "/items",
  apiTable: "items",
  labels: {
    singular: "Вещь",
    plural: "Вещи",
    results: { one: "вещь", few: "вещи", many: "вещей" },
    moveTitle: "Переместить вещь",
    moveSuccess: (destinationName) => `Вещь успешно перемещена в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении вещи",
    deleteConfirm: "Вы уверены, что хотите удалить эту вещь?",
    deleteSuccess: "Вещь успешно удалена",
    restoreSuccess: "Вещь успешно восстановлена",
    duplicateSuccess: "Вещь успешно дублирована",
  },
  actions: {
    actions: ["edit", "move", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
    move: {
      enabled: true,
      destinationTypes: ["room", "place", "container"],
    },
  },
  useActions: useItemsConfigActions,
  addForm: {
    title: "Добавить вещь",
    form: AddItemForm,
  },
  getName: (entity) =>
    entity.name != null && entity.name.trim() !== "" ? entity.name : `Вещь #${entity.id}`,
  icon: Package,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные вещи" },
      { type: "locationType", key: "locationType" },
      { type: "yesNoAll", key: "hasPhoto", label: "Есть фото" },
      { type: "room", key: "roomId" },
    ],
    initial: DEFAULT_ITEMS_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "room", label: "Помещение", width: "w-40", hideOnMobile: true },
    { key: "movedAt", label: "Дата перемещения", width: "w-40", hideOnMobile: true },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchItems,
  pagination: { pageSize: ITEMS_PAGE_SIZE },
};
