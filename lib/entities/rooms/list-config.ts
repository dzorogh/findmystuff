import { Building2 } from "lucide-react";
import type { ListConfig } from "@/lib/app/types/list-config";

export interface RoomsFilters {
  showDeleted: boolean;
  hasItems: boolean | null;
  hasContainers: boolean | null;
  hasPlaces: boolean | null;
}

export const DEFAULT_ROOMS_FILTERS: RoomsFilters = {
  showDeleted: false,
  hasItems: null,
  hasContainers: null,
  hasPlaces: null,
};

export const ROOMS_LIST_CONFIG: ListConfig<RoomsFilters, "id" | "name" | "counts" | "actions"> = {
  listIcon: Building2,
  getListDisplayName: (e) => (e.name != null && e.name.trim() !== "" ? e.name : `Помещение #${e.id}`),
  resultsLabel: { one: "помещение", few: "помещения", many: "помещений" },
  initialFilters: DEFAULT_ROOMS_FILTERS,
  filterConfig: [
    { type: "showDeleted", label: "Показывать удаленные помещения" },
    { type: "yesNoAll", key: "hasItems", label: "Есть вещи" },
    { type: "yesNoAll", key: "hasContainers", label: "Есть контейнеры" },
    { type: "yesNoAll", key: "hasPlaces", label: "Есть места" },
  ],
  columnsConfig: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "counts", label: "Вещи / Места / Контейнеры" },
    { key: "actions", label: "Действия" },
  ],
  actionsConfig: {
    actions: ["edit", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
  },
  moveFormConfig: {
    enabled: false,
  },
};
