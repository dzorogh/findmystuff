import { fetchRoomsList } from "@/lib/entities/rooms/list-fetch";

export function useRoomsListPageBehavior() {
  return {
    fetchList: fetchRoomsList,
    addDialog: true as const,
  };
}
