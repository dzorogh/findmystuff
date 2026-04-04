"use client";

import { useMemo } from "react";
import { useFurniture } from "./use-furniture";

const ALL_FURNITURE_OPTION = { value: "all", label: "Вся мебель" };

export function useFurnitureFilterOptions() {
  const { furniture, isLoading } = useFurniture();
  const options = useMemo(() => {
    if (isLoading) return [ALL_FURNITURE_OPTION];
    if (furniture?.length) {
      return [
        ALL_FURNITURE_OPTION,
        ...furniture.map((f) => {
          const defaultName = f.name || `Мебель #${f.id}`;
          return {
            value: f.id.toString(),
            label: f.room?.name ? `${defaultName} (${f.room.name})` : defaultName,
          };
        }),
      ];
    }
    return [ALL_FURNITURE_OPTION];
  }, [furniture, isLoading]);
  return { options, isLoading };
}
