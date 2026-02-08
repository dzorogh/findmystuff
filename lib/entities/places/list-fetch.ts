import { getPlaces } from "@/lib/places/api";
import type { Place } from "@/types/entity";
import type { FetchListParams, FetchListResult } from "@/lib/app/types/list-config";
import type { PlacesFilters } from "./list-config";

export async function fetchPlacesList(
  params: FetchListParams<PlacesFilters>
): Promise<FetchListResult> {
  const { query, filters, sortBy, sortDirection } = params;
  const response = await getPlaces({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    sortBy,
    sortDirection,
  });
  let list = Array.isArray(response?.data) ? response.data : [];
  if (filters.entityTypeId !== null) {
    list = list.filter((p: Place) => p.entity_type_id === filters.entityTypeId);
  }
  if (filters.roomId !== null) {
    list = list.filter((p: Place) => p.room?.room_id === filters.roomId);
  }
  return { data: list };
}
