import { fetchItemsList } from "@/lib/entities/items/list-fetch";

const ITEMS_PAGE_SIZE = 20;

export function useItemsListPageBehavior() {
  return {
    fetchList: fetchItemsList,
    pagination: { pageSize: ITEMS_PAGE_SIZE },
    addDialog: true as const,
  };
}
