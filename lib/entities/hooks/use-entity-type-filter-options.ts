"use client";

import { useMemo } from "react";
import { useEntityTypes } from "./use-entity-types";

const ALL_TYPES_OPTION = { value: "all", label: "Все типы" };
const EMPTY_OPTION = { value: "", label: "Не указан" };

export function useEntityTypeFilterOptions(
  category: "place" | "container" | "room" | "item",
  includeAll = true,
  includeEmpty = false,
) {
  const { types, isLoading } = useEntityTypes(category);
  const options = useMemo(() => {
    const options = [];
    if (includeAll) {
      options.push(ALL_TYPES_OPTION);
    }
    if (includeEmpty) {
      options.push(EMPTY_OPTION);
    }
    if (types?.length) {
      options.push(...types.map((t) => ({ value: t.id.toString(), label: t.name })));
      return [
        includeAll ? ALL_TYPES_OPTION : null,
        includeEmpty ? EMPTY_OPTION : null,
        ...types.map((t) => ({ value: t.id.toString(), label: t.name })),
      ];
    }
    return [];
  }, [types, includeAll, includeEmpty]);
  return { options, isLoading };
}
