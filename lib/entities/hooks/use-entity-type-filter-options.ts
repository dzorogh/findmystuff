"use client";

import { useMemo } from "react";
import { useEntityTypes } from "./use-entity-types";

const ALL_TYPES_OPTION = { value: "all", label: "Все типы" };

export function useEntityTypeFilterOptions(
  category: "place" | "container" | "room" | "item"
) {
  const { types, isLoading } = useEntityTypes(category);
  const options = useMemo(() => {
    if (isLoading) return [ALL_TYPES_OPTION];
    if (types?.length) {
      return [
        ALL_TYPES_OPTION,
        ...types.map((t) => ({ value: t.id.toString(), label: t.name })),
      ];
    }
    return [ALL_TYPES_OPTION];
  }, [types, isLoading]);
  return { options, isLoading };
}
