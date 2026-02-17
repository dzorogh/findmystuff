import { Container as ContainerIcon, LayoutGrid, Package } from "lucide-react";
import AddPlaceForm from "@/components/forms/add-place-form";
import { getPlaces } from "@/lib/places/api";
import type {
  EntityConfig,
  EntityDisplay,
  FetchListParams,
  FetchListResult,
  Filters,
} from "@/lib/app/types/entity-config";
import type { Place } from "@/types/entity";
import { usePlacesActions } from "@/lib/entities/places/use-places-actions";

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

function usePlacesConfigActions(
  config: EntityConfig,
  params: { refreshList: () => void }
) {
  const getRowActions = usePlacesActions({
    refreshList: params.refreshList,
    basePath: config.basePath,
    apiTable: config.apiTable,
    labels: config.labels,
    move: config.actions.move,
  });
  return (entity: EntityDisplay) => getRowActions(entity as Place);
}

export const placesEntityConfig: EntityConfig = {
  kind: "place",
  basePath: "/places",
  apiTable: "places",
  labels: {
    singular: "Место",
    plural: "Места",
    results: { one: "место", few: "места", many: "мест" },
    moveTitle: "Переместить место",
    moveSuccess: (destinationName) => `Место успешно перемещено в ${destinationName}`,
    moveError: "Произошла ошибка при перемещении места",
    deleteConfirm: "Вы уверены, что хотите удалить это место?",
    deleteSuccess: "Место успешно удалено",
    restoreSuccess: "Место успешно восстановлено",
    duplicateSuccess: "Место успешно дублировано",
  },
  actions: {
    actions: ["edit", "move", "printLabel", "duplicate", "delete"],
    showRestoreWhenDeleted: true,
    move: {
      enabled: true,
      destinationTypes: ["furniture"],
    },
  },
  useActions: (params) => usePlacesConfigActions(placesEntityConfig, params),
  addForm: {
    title: "Добавить место",
    form: AddPlaceForm,
  },
  getName: (entity) =>
    entity.name != null && entity.name.trim() !== "" ? entity.name : `Место #${entity.id}`,
  icon: LayoutGrid,
  filters: {
    fields: [
      { type: "showDeleted", label: "Показывать удаленные места" },
      { type: "entityType", key: "entityTypeId", entityKind: "place" },
      { type: "room", key: "roomId" },
      { type: "furniture", key: "furnitureId" },
    ],
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
};
