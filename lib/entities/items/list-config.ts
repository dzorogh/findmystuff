import { Package } from "lucide-react";
import type { ListConfig } from "@/lib/app/types/list-config";

export interface ItemsFilters {
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

export const ITEMS_LIST_CONFIG: ListConfig<ItemsFilters, "id" | "name" | "room" | "movedAt" | "actions"> = {
  listIcon: Package,
  getListDisplayName: (e) => (e.name != null && e.name.trim() !== "" ? e.name : `Вещь #${e.id}`),
  resultsLabel: { one: "вещь", few: "вещи", many: "вещей" },
  initialFilters: DEFAULT_ITEMS_FILTERS,
  filterConfig: [
    { type: "showDeleted", label: "Показывать удаленные вещи" },
    { type: "locationType", key: "locationType" }, 
    { type: "yesNoAll", key: "hasPhoto", label: "Есть фото" },
    { type: "room", key: "roomId" },
  ],
  columnsConfig: [
    { key: "id", label: "ID", width: "w-16", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "room", label: "Помещение", width: "w-40", hideOnMobile: true },
    { key: "movedAt", label: "Дата перемещения", width: "w-40", hideOnMobile: true },
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
