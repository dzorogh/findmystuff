import { getItems } from "@/lib/entities/api";
import type { FetchListParams, FetchListResult } from "@/lib/app/types/list-config";
import type { ItemsFilters } from "./list-config";

const ITEMS_PER_PAGE = 20;

export async function fetchItemsList(
  params: FetchListParams<ItemsFilters>
): Promise<FetchListResult> {
  const { query, filters, sortBy, sortDirection, page = 1 } = params;
  const response = await getItems({
    query: query?.trim(),
    showDeleted: filters.showDeleted,
    page,
    limit: ITEMS_PER_PAGE,
    locationType: filters.locationType,
    roomId: filters.roomId,
    hasPhoto: filters.hasPhoto,
    sortBy,
    sortDirection,
  });
  const data = Array.isArray(response?.data) ? response.data : [];
  return { data, totalCount: response?.totalCount ?? 0 };
}
