"use client";

import { useMemo } from "react";
import { useEntityTypes } from "./use-entity-types";

const ALL_TYPES_OPTION = { value: "all", label: "Все типы" };
const EMPTY_OPTION = { value: "", label: "Не указан" };

export function useEntityTypeFilterOptions(
  category: "place" | "container" | "room" | "item" | "building",
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
    }
    return options;
  }, [types, includeAll, includeEmpty]);
  return { options, isLoading };
}
