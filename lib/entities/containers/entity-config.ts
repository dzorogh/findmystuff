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
import type { ActionConfig } from "@/lib/app/types/entity-action";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  FilterFieldConfig,
  Filters,
} from "@/lib/app/types/entity-config";
import type { Container } from "@/types/entity";

export interface ContainersFilters extends Filters {
  showDeleted: boolean;
  entityTypeId: number | null;
  hasItems: boolean | null;
  locationType: "all" | "room" | "place" | "container" | null;
  placeId: number | null;
}

export const DEFAULT_CONTAINERS_FILTERS: ContainersFilters = {
  showDeleted: false,
  entityTypeId: null,
  hasItems: null,
  locationType: null,
  placeId: null,
};

const CONTAINERS_PAGE_SIZE = 20;

async function fetchContainers(params: FetchListParams): Promise<FetchListResult> {
  const { query, filterValues, sortBy, sortDirection } = params;
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
  });
  let list = Array.isArray(response?.data) ? response.data : [];
  const hasClientFilters =
    filters.entityTypeId !== null ||
    filters.hasItems !== null ||
    (filters.locationType !== null && filters.locationType !== "all");
  if (hasClientFilters) {
    list = list.filter((c: Container) => {
      if (filters.entityTypeId !== null && c.entity_type_id !== filters.entityTypeId) return false;
      if (filters.hasItems !== null) {
        const count = c.itemsCount ?? 0;
        if (filters.hasItems ? count === 0 : count > 0) return false;
      }
      if (
        filters.locationType !== null &&
        filters.locationType !== "all" &&
        c.last_location?.destination_type !== filters.locationType
      )
        return false;
      return true;
    });
  }
  return { data: list };
}

function createContainersActionsConfig(config: {
  basePath: string;
  labels: { moveTitle: string; moveSuccess: (n: string) => string; moveError: string };
}): { whenActive: ActionConfig[]; whenDeleted: ActionConfig[] } {
  const destTypes = ["room", "place", "container"] as const;
  return {
    whenActive: [
      { key: "edit", label: "Редактировать", icon: Pencil, getHref: (e) => `${config.basePath}/${e.id}` },
      {
        key: "move",
        label: "Переместить",
        icon: ArrowRightLeft,
        Form: MoveEntityForm as unknown as React.ComponentType<Record<string, unknown>>,
        getFormProps: (e, ctx) => ({
          title: config.labels.moveTitle,
          entityDisplayName: getEntityDisplayName("container", e.id, e.name),
          destinationTypes: destTypes,
          buildPayload: (destType: string, destId: number) => ({
            container_id: e.id,
            destination_type: destType,
            destination_id: destId,
          }),
          getSuccessMessage: config.labels.moveSuccess,
          getErrorMessage: () => config.labels.moveError,
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
  };
}

const containersConfigBase = {
  kind: "container" as const,
  basePath: "/containers",
  apiTable: "containers" as const,
  labels: {
    singular: "Контейнер",
    plural: "Контейнеры",
    results: { one: "контейнер", few: "контейнера", many: "контейнеров" },
    moveTitle: "Переместить контейнер",
    moveSuccess: (destinationName: string) =>
      `Контейнер успешно перемещён в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении контейнера",
    deleteConfirm: "Вы уверены, что хотите удалить этот контейнер?",
    deleteSuccess: "Контейнер успешно удалён",
    restoreSuccess: "Контейнер успешно восстановлен",
    duplicateSuccess: "Контейнер успешно дублирован",
  },
  addForm: {
    title: "Добавить контейнер",
    form: AddContainerForm,
  },
  getName: (entity: EntityDisplay) =>
      getEntityDisplayName("container", entity.id, entity.name),
  icon: ContainerIcon,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные контейнеры" },
      { type: "entityType", key: "entityTypeId", entityKind: "container" },
      { type: "yesNoAll", key: "hasItems", label: "Есть вещи внутри" },
      { type: "locationType", key: "locationType" },
    ] satisfies FilterFieldConfig[],
    initial: DEFAULT_CONTAINERS_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "location", label: "Расположение" },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchContainers,
  pagination: { pageSize: CONTAINERS_PAGE_SIZE },
};

export const containersEntityConfig: EntityConfig = {
  ...containersConfigBase,
  actions: createContainersActionsConfig(containersConfigBase),
  move: { enabled: true, destinationTypes: ["room", "place", "container"] },
};
