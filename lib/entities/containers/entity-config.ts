import {
  ArrowRightLeft,
  Container as ContainerIcon,
  Copy,
  Pencil,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import AddContainerForm from "@/components/forms/add-container-form";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { getContainers } from "@/lib/containers/api";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { ComponentType } from "react";
import { createFetchListResult } from "@/lib/entities/helpers/fetch-list";
import type {
  EntityConfig,
  FetchListParams,
  FetchListResult,
  FilterFieldConfig,
  Filters,
} from "@/types/entity";
import type { Container } from "@/types/entity";

export interface ContainersFilters extends Filters {
  showDeleted: boolean;
  entityTypeId: number | null;
  hasItems: boolean | null;
  locationType: "all" | "room" | "place" | "container" | "furniture" | null;
  placeId: number | null;
  furnitureId: number | null;
}

export const DEFAULT_CONTAINERS_FILTERS: ContainersFilters = {
  showDeleted: false,
  entityTypeId: null,
  hasItems: null,
  locationType: null,
  placeId: null,
  furnitureId: null,
};

const CONTAINERS_PAGE_SIZE = 20;

function matchesContainerFilters(c: Container, filters: ContainersFilters): boolean {
  if (filters.entityTypeId !== null && c.entity_type_id !== filters.entityTypeId) return false;
  if (filters.hasItems !== null) {
    const count = c.items_count ?? 0;
    if (filters.hasItems ? count === 0 : count > 0) return false;
  }
  if (
    filters.locationType !== null &&
    filters.locationType !== "all" &&
    c.last_location?.destination_type !== filters.locationType
  ) {
    return false;
  }
  return true;
}

async function fetchContainers(params: FetchListParams): Promise<FetchListResult> {
  const { query, filterValues, sortBy, sortDirection, tenantId } = params;
  const filters = filterValues as ContainersFilters;
  const response = await getContainers({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    sortBy,
    sortDirection,
    entityTypeId: filters.entityTypeId ?? undefined,
    hasItems: filters.hasItems ?? undefined,
    locationType: filters.locationType ?? undefined,
    placeId: filters.placeId ?? undefined,
    furnitureId: filters.furnitureId ?? undefined,
    tenantId,
  });
  let list = Array.isArray(response?.data) ? response.data : [];
  const hasClientFilters =
    filters.entityTypeId !== null ||
    filters.hasItems !== null ||
    (filters.locationType !== null && filters.locationType !== "all");
  if (hasClientFilters) {
    list = list.filter((c: Container) => matchesContainerFilters(c, filters));
  }
  return createFetchListResult({ data: list, totalCount: list.length });
}

const BASE_PATH = "/containers";
const CONTAINERS_MOVE_LABELS = {
  moveTitle: "Переместить контейнер",
  moveSuccess: (destinationName: string) =>
    `Контейнер успешно перемещён в ${destinationName}`,
  moveError: "Произошла ошибка при перемещении контейнера",
};
const CONTAINERS_DEST_TYPES = ["room", "place", "container", "furniture"] as const;

export const containersEntityConfig: EntityConfig = {
  kind: "container" as const,
  basePath: BASE_PATH,
  apiTable: "containers" as const,
  labels: {
    singular: "Контейнер",
    plural: "Контейнеры",
    results: { one: "контейнер", few: "контейнера", many: "контейнеров" },
    moveTitle: CONTAINERS_MOVE_LABELS.moveTitle,
    moveSuccess: CONTAINERS_MOVE_LABELS.moveSuccess,
    moveError: CONTAINERS_MOVE_LABELS.moveError,
    deleteConfirm: "Вы уверены, что хотите удалить этот контейнер?",
    deleteSuccess: "Контейнер успешно удалён",
    restoreSuccess: "Контейнер успешно восстановлен",
    duplicateSuccess: "Контейнер успешно дублирован",
  },
  addForm: {
    title: "Добавить контейнер",
    form: AddContainerForm,
  },
  icon: ContainerIcon,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные контейнеры" },
      { type: "entityType", key: "entityTypeId", entityKind: "container" },
      { type: "yesNoAll", key: "hasItems", label: "Есть вещи внутри" },
      { type: "locationType", key: "locationType" },
      { type: "furniture", key: "furnitureId" },
    ] satisfies FilterFieldConfig[],
    initial: DEFAULT_CONTAINERS_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "room", label: "Помещение", width: "w-40", hideOnMobile: true },
    { key: "movedAt", label: "Дата перемещения", width: "w-40", hideOnMobile: true },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchContainers,
  pagination: { pageSize: CONTAINERS_PAGE_SIZE },
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
          title: CONTAINERS_MOVE_LABELS.moveTitle,
          entityDisplayName: getEntityDisplayName("container", e.id, e.name),
          destinationTypes: CONTAINERS_DEST_TYPES,
          buildPayload: (destType: string, destId: number) => ({
            container_id: e.id,
            destination_type: destType,
            destination_id: destId,
          }),
          getSuccessMessage: CONTAINERS_MOVE_LABELS.moveSuccess,
          getErrorMessage: () => CONTAINERS_MOVE_LABELS.moveError,
          excludeContainerId: e.id,
          onSuccess: ctx.refreshList,
        }),
      },
      {
        key: "printLabel",
        label: "Печать этикетки",
        icon: Printer,
        getOnClick: (e, ctx) => () => ctx.printLabel?.(e.id, e.name),
      },
      { key: "duplicate", label: "Дублировать", icon: Copy, getOnClick: (e, ctx) => () => ctx.handleDuplicate?.(e.id) },
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
  },
};
