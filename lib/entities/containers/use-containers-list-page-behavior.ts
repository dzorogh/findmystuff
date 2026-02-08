import { fetchContainersList } from "@/lib/entities/containers/list-fetch";

export function useContainersListPageBehavior() {
  return {
    fetchList: fetchContainersList,
    addDialog: true as const,
  };
}
