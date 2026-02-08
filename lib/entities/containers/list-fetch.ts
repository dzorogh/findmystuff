import { getContainers } from "@/lib/containers/api";
import type { Container } from "@/types/entity";
import type { FetchListParams, FetchListResult } from "@/lib/app/types/list-config";
import type { ContainersFilters } from "./list-config";

export async function fetchContainersList(
  params: FetchListParams<ContainersFilters>
): Promise<FetchListResult> {
  const { query, filters, sortBy, sortDirection } = params;
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
