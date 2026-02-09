import { Building2 } from "lucide-react";
import AddRoomForm from "@/components/forms/add-room-form";
import { getRooms } from "@/lib/rooms/api";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  Filters,
} from "@/lib/app/types/entity-config";
import type { Room } from "@/types/entity";
import { useRoomsActions } from "@/lib/entities/rooms/use-rooms-actions";

export interface RoomsFilters extends Filters {
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

async function fetchRooms(params: FetchListParams): Promise<FetchListResult> {
  const { query, filterValues, sortBy, sortDirection } = params;
  const filters = filterValues as RoomsFilters;
  const response = await getRooms({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    sortBy,
    sortDirection,
    hasItems: filters.hasItems ?? undefined,
    hasContainers: filters.hasContainers ?? undefined,
    hasPlaces: filters.hasPlaces ?? undefined,
  });
  const list = Array.isArray(response?.data) ? response.data : [];
  const totalCount = response?.totalCount ?? list.length;
  return { data: list, totalCount };
}

function useRoomsConfigActions(params: { refreshList: () => void }) {
  const getRowActions = useRoomsActions({
    refreshList: params.refreshList,
    basePath: roomsEntityConfig.basePath,
    apiTable: roomsEntityConfig.apiTable,
    labels: roomsEntityConfig.labels,
  });
  return (entity: EntityDisplay) => getRowActions(entity as Room);
}

export const roomsEntityConfig: EntityConfig = {
  kind: "room",
  basePath: "/rooms",
  apiTable: "rooms",
  labels: {
    singular: "Помещение",
    plural: "Помещения",
    results: { one: "помещение", few: "помещения", many: "помещений" },
    moveTitle: "Переместить помещение",
    moveSuccess: (destinationName) => `Помещение успешно перемещено в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении помещения",
    deleteConfirm: "Вы уверены, что хотите удалить это помещение?",
    deleteSuccess: "Помещение успешно удалено",
    restoreSuccess: "Помещение успешно восстановлено",
    duplicateSuccess: "Помещение успешно дублировано",
  },
  actions: {
    actions: ["edit", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
  },
  useActions: useRoomsConfigActions,
  addForm: {
    title: "Добавить помещение",
    form: AddRoomForm,
  },
  getName: (entity) =>
    entity.name != null && entity.name.trim() !== "" ? entity.name : `Помещение #${entity.id}`,
  icon: Building2,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные помещения" },
      { type: "yesNoAll", key: "hasItems", label: "Есть вещи" },
      { type: "yesNoAll", key: "hasContainers", label: "Есть контейнеры" },
      { type: "yesNoAll", key: "hasPlaces", label: "Есть места" },
    ],
    initial: DEFAULT_ROOMS_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "counts", label: "Содержимое" },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchRooms,
};
