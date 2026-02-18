import { ArrowRightLeft, Copy, Package, Pencil, Printer, RotateCcw, Trash2 } from "lucide-react";
import AddItemForm from "@/components/forms/add-item-form";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { getItems } from "@/lib/entities/api";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { ActionConfig } from "@/lib/app/types/entity-action";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  FilterFieldConfig,
  Filters,
} from "@/lib/app/types/entity-config";

export interface ItemsFilters extends Filters {
  showDeleted: boolean;
  locationType: "all" | "room" | "place" | "container" | null;
  hasPhoto: boolean | null;
  roomId: number | null;
  placeId: number | null;
  containerId: number | null;
}

export const DEFAULT_ITEMS_FILTERS: ItemsFilters = {
  showDeleted: false,
  locationType: null,
  hasPhoto: null,
  roomId: null,
  placeId: null,
  containerId: null,
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
    roomId: filters.roomId ?? undefined,
    placeId: filters.placeId ?? undefined,
    containerId: filters.containerId ?? undefined,
    hasPhoto: filters.hasPhoto,
    sortBy,
    sortDirection,
  });
  const data = Array.isArray(response?.data) ? response.data : [];
  return { data, totalCount: response?.totalCount ?? 0 };
}

function createItemsActionsConfig(config: {
  basePath: string;
  labels: { moveTitle: string; moveSuccess: (n: string) => string; moveError: string };
}): { whenActive: ActionConfig[]; whenDeleted: ActionConfig[] } {
  const destTypes = ["room", "place", "container"] as const;
  return {
    whenActive: [
      {
        key: "edit",
        label: "Редактировать",
        icon: Pencil,
        getHref: (e) => `${config.basePath}/${e.id}`,
      },
      {
        key: "move",
        label: "Переместить",
        icon: ArrowRightLeft,
        Form: MoveEntityForm as unknown as React.ComponentType<Record<string, unknown>>,
        getFormProps: (e, ctx) => ({
          title: config.labels.moveTitle,
          entityDisplayName: getEntityDisplayName("item", e.id, e.name),
          destinationTypes: destTypes,
          buildPayload: (destType: string, destId: number) => ({
            item_id: e.id,
            destination_type: destType,
            destination_id: destId,
          }),
          getSuccessMessage: config.labels.moveSuccess,
          getErrorMessage: () => config.labels.moveError,
          onSuccess: ctx.refreshList,
        }),
      },
      {
        key: "printLabel",
        label: "Печать этикетки",
        icon: Printer,
        getOnClick: (e, ctx) => () => ctx.printLabel?.(e.id, e.name),
      },
      {
        key: "duplicate",
        label: "Дублировать",
        icon: Copy,
        getOnClick: (e, ctx) => () => ctx.handleDuplicate?.(e.id),
      },
      {
        key: "delete",
        label: "Удалить",
        icon: Trash2,
        variant: "destructive",
        getOnClick: (e, ctx) => () => ctx.handleDelete?.(e.id),
      },
    ],
    whenDeleted: [
      {
        key: "restore",
        label: "Восстановить",
        icon: RotateCcw,
        getOnClick: (e, ctx) => () => ctx.handleRestore?.(e.id),
      },
    ],
  };
}

const itemsConfigBase = {
  kind: "item" as const,
  basePath: "/items",
  apiTable: "items" as const,
  labels: {
    singular: "Вещь",
    plural: "Вещи",
    results: { one: "вещь", few: "вещи", many: "вещей" },
    moveTitle: "Переместить вещь",
    moveSuccess: (destinationName: string) => `Вещь успешно перемещена в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении вещи",
    deleteConfirm: "Вы уверены, что хотите удалить эту вещь?",
    deleteSuccess: "Вещь успешно удалена",
    restoreSuccess: "Вещь успешно восстановлена",
    duplicateSuccess: "Вещь успешно дублирована",
  },
  addForm: {
    title: "Добавить вещь",
    form: AddItemForm,
  },
  getName: (entity: EntityDisplay) =>
    entity.name != null && entity.name.trim() !== "" ? entity.name : `Вещь #${entity.id}`,
  icon: Package,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные вещи" },
      { type: "locationType", key: "locationType" },
      { type: "yesNoAll", key: "hasPhoto", label: "Есть фото" },
      { type: "room", key: "roomId" },
    ] satisfies FilterFieldConfig[],
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

export const itemsEntityConfig: EntityConfig = {
  ...itemsConfigBase,
  actions: createItemsActionsConfig(itemsConfigBase),
  move: { enabled: true, destinationTypes: ["room", "place", "container"] },
};
