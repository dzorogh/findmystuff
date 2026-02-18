import {
  ArrowRightLeft,
  Container as ContainerIcon,
  Copy,
  LayoutGrid,
  Package,
  Pencil,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import AddPlaceForm from "@/components/forms/add-place-form";
import MovePlaceForm from "@/components/forms/move-place-form";
import { getPlaces } from "@/lib/places/api";
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
import type { Place } from "@/types/entity";

export interface PlacesFilters extends Filters {
  showDeleted: boolean;
  entityTypeId: number | null;
  roomId: number | null;
  furnitureId: number | null;
}

export const DEFAULT_PLACES_FILTERS: PlacesFilters = {
  showDeleted: false,
  entityTypeId: null,
  roomId: null,
  furnitureId: null,
};

async function fetchPlaces(params: FetchListParams): Promise<FetchListResult> {
  const { query, filterValues, sortBy, sortDirection } = params;
  const filters = filterValues as PlacesFilters;
  const response = await getPlaces({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    sortBy,
    sortDirection,
    entityTypeId: filters.entityTypeId ?? undefined,
    roomId: filters.roomId ?? undefined,
    furnitureId: filters.furnitureId ?? undefined,
  });
  const list = Array.isArray(response?.data) ? response.data : [];
  return { data: list };
}

function createPlacesActionsConfig(config: {
  basePath: string;
  labels: { moveTitle: string; moveSuccess: (n: string) => string; moveError: string };
}): { whenActive: ActionConfig[]; whenDeleted: ActionConfig[] } {
  return {
    whenActive: [
      { key: "edit", label: "Редактировать", icon: Pencil, getHref: (e) => `${config.basePath}/${e.id}` },
      {
        key: "move",
        label: "Переместить",
        icon: ArrowRightLeft,
        Form: MovePlaceForm as unknown as React.ComponentType<Record<string, unknown>>,
        getFormProps: (e, ctx) => ({
          title: config.labels.moveTitle,
          entityDisplayName: getEntityDisplayName("place", e.id, e.name),
          placeId: e.id,
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
      { key: "restore", label: "Восстановить", icon: RotateCcw, getOnClick: (e, ctx) => () => ctx.handleRestore?.(e.id) },
    ],
  };
}

const placesConfigBase = {
  kind: "place" as const,
  basePath: "/places",
  apiTable: "places" as const,
  labels: {
    singular: "Место",
    plural: "Места",
    results: { one: "место", few: "места", many: "мест" },
    moveTitle: "Переместить место",
    moveSuccess: (destinationName: string) =>
        `Место успешно перемещено в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении места",
    deleteConfirm: "Вы уверены, что хотите удалить это место?",
    deleteSuccess: "Место успешно удалено",
    restoreSuccess: "Место успешно восстановлено",
    duplicateSuccess: "Место успешно дублировано",
  },
  addForm: {
    title: "Добавить место",
    form: AddPlaceForm,
  },
  getName: (entity: EntityDisplay) =>
    entity.name != null && entity.name.trim() !== ""
      ? entity.name
      : `Место #${entity.id}`,
  icon: LayoutGrid,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные места" },
      { type: "entityType", key: "entityTypeId", entityKind: "place" },
      { type: "room", key: "roomId" },
      { type: "furniture", key: "furnitureId" },
    ] satisfies FilterFieldConfig[],
    initial: DEFAULT_PLACES_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "room", label: "Мебель" },
    { key: "counts", label: "Содержимое" },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchPlaces,
  counts: {
    filterParam: "placeId",
    links: [
      { path: "/items", field: "items_count", icon: Package, label: "вещ." },
      { path: "/containers", field: "containers_count", icon: ContainerIcon, label: "конт." },
    ],
  },
  groupBy: (entity: EntityDisplay) => {
    const place = entity as Place;
    const name = place.furniture_name?.trim();
    return name && name.length > 0 ? name : null;
  },
  groupByEmptyLabel: "Без мебели",
};

export const placesEntityConfig: EntityConfig = {
  ...placesConfigBase,
  actions: createPlacesActionsConfig(placesConfigBase),
};
