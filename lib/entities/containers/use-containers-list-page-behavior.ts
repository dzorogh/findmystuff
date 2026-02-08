import { fetchContainersList } from "@/lib/entities/containers/list-fetch";

const CONTAINERS_PAGE_SIZE = 20;

export function useContainersListPageBehavior() {
  return {
    fetchList: fetchContainersList,
    pagination: { pageSize: CONTAINERS_PAGE_SIZE },
    addDialog: true as const,
  };
}
