import { ArrowRightLeft, Copy, Package, Pencil, Printer, RotateCcw, Trash2 } from "lucide-react";
import AddItemForm from "@/components/forms/add-item-form";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { getItems } from "@/lib/entities/api";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { ComponentType } from "react";
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
  locationType: "all" | "room" | "place" | "container" | "furniture" | null;
  hasPhoto: boolean | null;
  roomId: number | null;
  placeId: number | null;
  containerId: number | null;
  furnitureId: number | null;
}

export const DEFAULT_ITEMS_FILTERS: ItemsFilters = {
  showDeleted: false,
  locationType: null,
  hasPhoto: null,
  roomId: null,
  placeId: null,
  containerId: null,
  furnitureId: null,
};

const ITEMS_PAGE_SIZE = 20;

async function fetchItems(params: FetchListParams): Promise<FetchListResult> {
  const { query, filterValues, sortBy, sortDirection, page = 1, tenantId } = params;
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
    furnitureId: filters.furnitureId ?? undefined,
    hasPhoto: filters.hasPhoto,
    sortBy,
    sortDirection,
    tenantId,
  });
  const data = Array.isArray(response?.data) ? response.data : [];
  return { data, totalCount: response?.totalCount ?? 0 };
}

const BASE_PATH = "/items";
const ITEMS_MOVE_LABELS = {
  moveTitle: "Переместить вещь",
  moveSuccess: (destinationName: string) => `Вещь успешно перемещена в ${destinationName}`,
  moveError: "Произошла ошибка при перемещении вещи",
};
const ITEMS_DEST_TYPES = ["room", "place", "container", "furniture"] as const;

export const itemsEntityConfig: EntityConfig = {
  kind: "item" as const,
  basePath: BASE_PATH,
  apiTable: "items" as const,
  labels: {
    singular: "Вещь",
    plural: "Вещи",
    results: { one: "вещь", few: "вещи", many: "вещей" },
    moveTitle: ITEMS_MOVE_LABELS.moveTitle,
    moveSuccess: ITEMS_MOVE_LABELS.moveSuccess,
    moveError: ITEMS_MOVE_LABELS.moveError,
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
      { type: "furniture", key: "furnitureId" },
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
  move: { enabled: true, destinationTypes: ["room", "place", "container", "furniture"] },
  actions: {
    whenActive: [
      { key: "edit", label: "Редактировать", icon: Pencil, getHref: (e) => `${BASE_PATH}/${e.id}` },
      {
        key: "move",
        label: "Переместить",
        icon: ArrowRightLeft,
        Form: MoveEntityForm as unknown as ComponentType<Record<string, unknown>>,
        getFormProps: (e, ctx) => ({
          title: ITEMS_MOVE_LABELS.moveTitle,
          entityDisplayName: getEntityDisplayName("item", e.id, e.name),
          destinationTypes: ITEMS_DEST_TYPES,
          buildPayload: (destType: string, destId: number) => ({
            item_id: e.id,
            destination_type: destType,
            destination_id: destId,
          }),
          getSuccessMessage: ITEMS_MOVE_LABELS.moveSuccess,
          getErrorMessage: () => ITEMS_MOVE_LABELS.moveError,
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
  },
};
