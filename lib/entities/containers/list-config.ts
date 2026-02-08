import type { ListConfig } from "@/lib/app/types/list-config";

export interface ContainersFilters {
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

export const CONTAINERS_LIST_CONFIG: ListConfig<
  ContainersFilters,
  "id" | "name" | "location" | "actions"
> = {
  resultsLabel: { singular: "контейнер", plural: "контейнеров" },
  initialFilters: DEFAULT_CONTAINERS_FILTERS,
  filterConfig: [
    { type: "showDeleted", label: "Показывать удаленные контейнеры" },
    { type: "entityType", key: "entityTypeId", entityKind: "container" },
    { type: "yesNoAll", key: "hasItems", label: "Есть вещи внутри" },
    { type: "locationType", key: "locationType" },
  ],
  columnsConfig: [
    { key: "id", label: "ID", width: "w-[50px]", hideOnMobile: true },
    { key: "name", label: "Название" },
    { key: "location", label: "Расположение" },
    { key: "actions", label: "Действия" },
  ],
  actionsConfig: {
    actions: ["edit", "move", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
  },
  moveFormConfig: {
    enabled: true,
    destinationTypes: ["room", "place", "container"],
  },
};
