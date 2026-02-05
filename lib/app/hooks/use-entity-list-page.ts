"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_ENTITY_SORT, type EntitySortOption } from "@/lib/entities/helpers/sort";

export const useEntityListPageState = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userOpenedAdd, setUserOpenedAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [sort, setSort] = useState<EntitySortOption>(DEFAULT_ENTITY_SORT);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldOpenCreateForm = searchParams.get("create") === "1";
  const isAddDialogOpen = shouldOpenCreateForm || userOpenedAdd;

  const handleEntityAdded = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchStateChange = useCallback(
    (state: { isSearching: boolean; resultsCount: number }) => {
      setIsSearching(state.isSearching);
      setResultsCount(state.resultsCount);
    },
    []
  );

  const handleAddDialogOpenChange = useCallback(
    (open: boolean) => {
      setUserOpenedAdd(open);
      if (!open && shouldOpenCreateForm) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("create");
        const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(nextUrl, { scroll: false });
      }
    },
    [pathname, router, searchParams, shouldOpenCreateForm]
  );

  return {
    refreshTrigger,
    searchQuery,
    isSearching,
    resultsCount,
    isFiltersOpen,
    setIsFiltersOpen,
    activeFiltersCount,
    setActiveFiltersCount,
    sort,
    setSort,
    isAddDialogOpen,
    handleEntityAdded,
    handleAddDialogOpenChange,
    handleSearchChange,
    handleSearchStateChange,
  };
};
