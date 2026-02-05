"use client";

import { useEffect, useState } from "react";

export const useListFiltersState = <T extends { showDeleted: boolean }>(
  initialFilters: T,
  externalShowDeleted?: boolean
) => {
  const [filters, setFilters] = useState<T>(initialFilters);

  useEffect(() => {
    if (externalShowDeleted !== undefined) {
      setFilters((prev) => ({ ...prev, showDeleted: externalShowDeleted }));
    }
  }, [externalShowDeleted]);

  return { filters, setFilters };
};
