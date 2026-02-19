import type { ComponentType } from "react";
import { ArrowRightLeft, Copy, DoorOpen, Package, Pencil, Printer, RotateCcw, Sofa, Trash2 } from "lucide-react";
import AddRoomForm from "@/components/forms/add-room-form";
import MoveRoomForm from "@/components/forms/move-room-form";
import { getRooms } from "@/lib/rooms/api";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  FilterFieldConfig,
  Filters,
} from "@/lib/app/types/entity-config";
import type { Room } from "@/types/entity";

export interface RoomsFilters extends Filters {
  showDeleted: boolean;
  hasItems: boolean | null;
  hasContainers: boolean | null;
  hasPlaces: boolean | null;
  buildingId: number | null;
}

export const DEFAULT_ROOMS_FILTERS: RoomsFilters = {
  showDeleted: false,
  hasItems: null,
  hasContainers: null,
  hasPlaces: null,
  buildingId: null,
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
    buildingId: filters.buildingId ?? undefined,
  });
  const list = Array.isArray(response?.data) ? response.data : [];
  const totalCount = response?.totalCount ?? list.length;
  return { data: list, totalCount };
}

const BASE_PATH = "/rooms";
const ROOMS_MOVE_LABELS = {
  moveTitle: "Переместить помещение",
  moveSuccess: (destinationName: string) =>
    `Помещение успешно перемещено в ${destinationName}`,
  moveError: "Произошла ошибка при перемещении помещения",
};

export const roomsEntityConfig: EntityConfig = {
  kind: "room" as const,
  basePath: BASE_PATH,
  apiTable: "rooms" as const,
  labels: {
    singular: "Помещение",
    plural: "Помещения",
    results: { one: "помещение", few: "помещения", many: "помещений" },
    moveTitle: ROOMS_MOVE_LABELS.moveTitle,
    moveSuccess: ROOMS_MOVE_LABELS.moveSuccess,
    moveError: ROOMS_MOVE_LABELS.moveError,
    deleteConfirm: "Вы уверены, что хотите удалить это помещение?",
    deleteSuccess: "Помещение успешно удалено",
    restoreSuccess: "Помещение успешно восстановлено",
    duplicateSuccess: "Помещение успешно дублировано",
  },
  addForm: {
    title: "Добавить помещение",
    form: AddRoomForm,
  },
  getName: (entity: EntityDisplay) =>
    entity.name != null && entity.name.trim() !== "" ? entity.name : `Помещение #${entity.id}`,
  icon: DoorOpen,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные помещения" },
      { type: "building", key: "buildingId" },
      { type: "yesNoAll", key: "hasItems", label: "Есть вещи" },
      { type: "yesNoAll", key: "hasContainers", label: "Есть контейнеры" },
      { type: "yesNoAll", key: "hasPlaces", label: "Есть места" },
    ] satisfies FilterFieldConfig[],
    initial: DEFAULT_ROOMS_FILTERS,
  },
  columns: [
    { key: "id", label: "ID", width: "w-12", hideOnMobile: true },
    { key: "name", label: "Название", width: "w-80" },
    { key: "counts", label: "Содержимое", hideOnMobile: true },
    { key: "actions", label: "Действия" },
  ],
  fetch: fetchRooms,
  counts: {
    filterParam: "roomId",
    links: [
      { path: "/furniture", field: "furniture_count", icon: Sofa, label: "меб." },
      { path: "/items", field: "items_count", icon: Package, label: "вещ." },
    ],
  },
  defaultSort: { sortBy: "name" as const, sortDirection: "asc" as const },
  groupBy: (entity: EntityDisplay) => {
    const room = entity as Room;
    const name = room.building_name?.trim();
    return name && name.length > 0 ? name : null;
  },
  actions: {
    whenActive: [
      { key: "edit", label: "Редактировать", icon: Pencil, getHref: (e) => `${BASE_PATH}/${e.id}` },
      {
        key: "move",
        label: "Переместить",
        icon: ArrowRightLeft,
        Form: MoveRoomForm as unknown as ComponentType<Record<string, unknown>>,
        getFormProps: (e, ctx) => ({
          title: ROOMS_MOVE_LABELS.moveTitle,
          entityDisplayName: getEntityDisplayName("room", e.id, e.name),
          roomId: e.id,
          getSuccessMessage: ROOMS_MOVE_LABELS.moveSuccess,
          getErrorMessage: () => ROOMS_MOVE_LABELS.moveError,
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
