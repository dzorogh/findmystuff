import { getRooms } from "@/lib/rooms/api";
import type { Room } from "@/types/entity";
import type { FetchListParams, FetchListResult } from "@/lib/app/types/list-config";
import type { RoomsFilters } from "./list-config";

export async function fetchRoomsList(
  params: FetchListParams<RoomsFilters>
): Promise<FetchListResult> {
  const { query, filters, sortBy, sortDirection } = params;
  const response = await getRooms({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    sortBy,
    sortDirection,
  });
  let list = Array.isArray(response?.data) ? response.data : [];
  if (filters.hasItems !== null) {
    list = list.filter((r: Room) =>
      filters.hasItems ? (r.items_count || 0) > 0 : (r.items_count || 0) === 0
    );
  }
  if (filters.hasContainers !== null) {
    list = list.filter((r: Room) =>
      filters.hasContainers ? (r.containers_count || 0) > 0 : (r.containers_count || 0) === 0
    );
  }
  if (filters.hasPlaces !== null) {
    list = list.filter((r: Room) =>
      filters.hasPlaces ? (r.places_count || 0) > 0 : (r.places_count || 0) === 0
    );
  }
  return { data: list };
}
