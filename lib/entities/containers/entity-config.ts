import { Container as ContainerIcon } from "lucide-react";
import AddContainerForm from "@/components/forms/add-container-form";
import { getContainers } from "@/lib/containers/api";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  Filters,
} from "@/lib/app/types/entity-config";
import type { Container } from "@/types/entity";
import { useContainersActions } from "@/lib/entities/containers/use-containers-actions";

export interface ContainersFilters extends Filters {
  showDeleted: boolean;
  entityTypeId: number | null;
  hasItems: boolean | null;
  locationType: "all" | "room" | "place" | "container" | null;
}

export const DEFAULT_CONTAINERS_FILTERS: ContainersFilters = {
  showDeleted: false,
  entityTypeId: null,
  hasItems: null,
  locationType: null,
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
  });
  let list = Array.isArray(response?.data) ? response.data : [];
  if (filters.entityTypeId !== null) {
    list = list.filter((c: Container) => c.entity_type_id === filters.entityTypeId);
  }
  if (filters.hasItems !== null) {
    list = list.filter((c: Container) =>
      filters.hasItems ? (c.itemsCount ?? 0) > 0 : (c.itemsCount ?? 0) === 0
    );
  }
  if (filters.locationType !== null && filters.locationType !== "all") {
    list = list.filter(
      (c: Container) => c.last_location?.destination_type === filters.locationType
    );
  }
  return { data: list };
}

function useContainersConfigActions(params: { refreshList: () => void }) {
  const getRowActions = useContainersActions({
    refreshList: params.refreshList,
    basePath: containersEntityConfig.basePath,
    apiTable: containersEntityConfig.apiTable,
    labels: containersEntityConfig.labels,
    move: containersEntityConfig.actions.move,
  });
  return (entity: EntityDisplay) => getRowActions(entity as Container);
}

export const containersEntityConfig: EntityConfig = {
  kind: "container",
  basePath: "/containers",
  apiTable: "containers",
  labels: {
    singular: "Контейнер",
    plural: "Контейнеры",
    results: { one: "контейнер", few: "контейнера", many: "контейнеров" },
    moveTitle: "Переместить контейнер",
    moveSuccess: (destinationName) => `Контейнер успешно перемещён в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении контейнера",
    deleteConfirm: "Вы уверены, что хотите удалить этот контейнер?",
    deleteSuccess: "Контейнер успешно удалён",
    restoreSuccess: "Контейнер успешно восстановлен",
    duplicateSuccess: "Контейнер успешно дублирован",
  },
  actions: {
    actions: ["edit", "move", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
    move: {
      enabled: true,
      destinationTypes: ["room", "place", "container"],
    },
  },
  useActions: useContainersConfigActions,
  addForm: {
    title: "Добавить контейнер",
    form: AddContainerForm,
  },
  getName: (entity) => getEntityDisplayName("container", entity.id, entity.name),
  icon: ContainerIcon,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные контейнеры" },
      { type: "entityType", key: "entityTypeId", entityKind: "container" },
      { type: "yesNoAll", key: "hasItems", label: "Есть вещи внутри" },
      { type: "locationType", key: "locationType" },
    ],
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
