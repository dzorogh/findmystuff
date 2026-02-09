"use client";

import { useMemo } from "react";
import { useRooms } from "./use-rooms";

const ALL_ROOMS_OPTION = { value: "all", label: "Все помещения" };

export function useRoomFilterOptions() {
  const { rooms, isLoading } = useRooms();
  const options = useMemo(() => {
    if (isLoading) return [ALL_ROOMS_OPTION];
    if (rooms?.length) {
      return [
        ALL_ROOMS_OPTION,
        ...rooms.map((r) => ({
          value: r.id.toString(),
          label: r.name || `Помещение #${r.id}`,
        })),
      ];
    }
    return [ALL_ROOMS_OPTION];
  }, [rooms, isLoading]);
  return { options, isLoading };
}
