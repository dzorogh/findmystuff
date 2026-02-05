"use client";

import { useState } from "react";

export const useListFiltersState = <T extends { showDeleted: boolean }>(
  initialFilters: T,
  externalShowDeleted?: boolean
) => {
  const [filters, setFilters] = useState<T>(initialFilters);

  const effectiveFilters: T =
    externalShowDeleted !== undefined
      ? { ...filters, showDeleted: externalShowDeleted }
      : filters;

  return { filters: effectiveFilters, setFilters };
};
