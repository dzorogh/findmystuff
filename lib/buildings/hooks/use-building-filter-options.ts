"use client";

import { useMemo } from "react";
import { useBuildings } from "./use-buildings";

const ALL_BUILDINGS_OPTION = { value: "all", label: "Все здания" };

export function useBuildingFilterOptions() {
  const { buildings, isLoading } = useBuildings();
  const options = useMemo(() => {
    if (isLoading) return [ALL_BUILDINGS_OPTION];
    if (buildings?.length) {
      return [
        ALL_BUILDINGS_OPTION,
        ...buildings.map((b) => ({
          value: b.id.toString(),
          label: b.name || `Здание #${b.id}`,
        })),
      ];
    }
    return [ALL_BUILDINGS_OPTION];
  }, [buildings, isLoading]);
  return { options, isLoading };
}
