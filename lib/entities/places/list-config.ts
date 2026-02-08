import { Warehouse } from "lucide-react";
import type { ListConfig } from "@/lib/app/types/list-config";

export interface PlacesFilters {
  showDeleted: boolean;
  entityTypeId: number | null;
  roomId: number | null;
}

export const DEFAULT_PLACES_FILTERS: PlacesFilters = {
  showDeleted: false,
  entityTypeId: null,
  roomId: null,
};

export const PLACES_LIST_CONFIG: ListConfig<PlacesFilters, "id" | "name" | "room" | "actions"> = {
  listIcon: Warehouse,
  getListDisplayName: (e) => (e.name != null && e.name.trim() !== "" ? e.name : `Место #${e.id}`),
  resultsLabel: { one: "место", few: "места", many: "мест" },
  initialFilters: DEFAULT_PLACES_FILTERS,
  filterConfig: [
    { type: "showDeleted", label: "Показывать удаленные места" },
    { type: "entityType", key: "entityTypeId", entityKind: "place" },
    { type: "room", key: "roomId" },
  ],
  columnsConfig: [
    { key: "id", label: "ID", width: "w-[50px]", hideOnMobile: true },
    { key: "name", label: "Название" },
    { key: "room", label: "Помещение" },
    { key: "actions", label: "Действия" },
  ],
  actionsConfig: {
    actions: ["edit", "move", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
  },
  moveFormConfig: {
    enabled: true,
    destinationTypes: ["room", "container"],
  },
};
