import { fetchPlacesList } from "@/lib/entities/places/list-fetch";

export function usePlacesListPageBehavior() {
  return {
    fetchList: fetchPlacesList,
    addDialog: true as const,
  };
}
