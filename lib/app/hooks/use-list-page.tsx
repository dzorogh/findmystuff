"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useQueryStates } from "nuqs";
import { useTenant } from "@/contexts/tenant-context";
import { deepEqual } from "@/lib/app/helpers/deep-equal";
import {
  getEntitySortParams,
  sortParamsToOption,
  type EntitySortOption,
} from "@/lib/entities/helpers/sort";
import {
  createListPageParsers,
  urlStateToFilters,
  filtersToUrlState,
} from "@/lib/app/hooks/list-page-url-state";
import type {
  EntityConfig,
  EntityDisplay,
  Filters,
  ListPagePagination,
  Results,
} from "@/lib/app/types/entity-config";

const DEBOUNCE_MS = 300;

/** Inlined request-key logic: avoid duplicate in-flight requests */
function useRequestKey() {
  const isLoadingRef = useRef(false);
  const requestKeyRef = useRef("");

  const shouldStart = useCallback((key: string) => {
    if (isLoadingRef.current && requestKeyRef.current === key) return false;
    isLoadingRef.current = true;
    requestKeyRef.current = key;
    return true;
  }, []);

  const isLatest = useCallback((key: string) => requestKeyRef.current === key, []);
  const finish = useCallback((key: string) => {
    if (requestKeyRef.current === key) {
      isLoadingRef.current = false;
      requestKeyRef.current = "";
    }
  }, []);

  return { shouldStart, isLatest, finish };
}

/** Inlined debounced search: call onSearch when searchQuery changes after delay */
function useDebouncedSearch(
  searchQuery: string,
  onSearch: (query: string) => void,
  options: { delay?: number; skipInitial?: boolean } = {}
) {
  const { delay = DEBOUNCE_MS, skipInitial = true } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);
  const isInitialMountRef = useRef(true);
  const previousQueryRef = useRef(searchQuery);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (skipInitial && isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousQueryRef.current = searchQuery;
      return;
    }
    if (previousQueryRef.current === searchQuery) return;
    previousQueryRef.current = searchQuery;
    if (timerRef.current) clearTimeout(timerRef.current);
    const timer = setTimeout(() => {
      onSearchRef.current(searchQuery.trim() || "");
    }, delay);
    timerRef.current = timer;
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [searchQuery, delay, skipInitial]);
}

export interface EntityListState<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sort: EntitySortOption;
  filters: Filters;
  isFiltersOpen: boolean;
  results: Results;
}

export function useListPage(config: EntityConfig) {
  const { activeTenantId } = useTenant();
  const {
    filters: filtersConfig,
    columns,
    addForm,
    labels,
    icon,
    getName,
    fetch: fetchData,
    pagination: paginationConfig,
    kind,
    basePath,
    apiTable,
    counts,
  } = config;

  const filterFields = filtersConfig.fields;
  const initialFilters = filtersConfig.initial;
  const results = labels.results;
  const hasPagination = paginationConfig != null;
  const hasAddForm = addForm != null;

  const pageSize = hasPagination ? paginationConfig.pageSize : 20;

  const parsers = useMemo(
    () => createListPageParsers(config.defaultSort),
    [config.defaultSort]
  );
  const [urlState, setUrlState] = useQueryStates(parsers);
  const searchQuery = urlState.search;
  const sort = sortParamsToOption(urlState.sortBy, urlState.sortDirection);
  const filters = urlStateToFilters(urlState, initialFilters);
  const currentPage = urlState.page;

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EntityDisplay[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [addFormOpen, setAddFormOpen] = useState(false);

  const isMountedRef = useRef(true);
  const { shouldStart, isLatest, finish } = useRequestKey();
  const { sortBy, sortDirection } = getEntitySortParams(sort);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const startLoading = useCallback((initial: boolean) => {
    if (initial) setIsLoading(true);
    setError(null);
  }, []);

  const finishLoading = useCallback((initial: boolean) => {
    if (initial) setIsLoading(false);
  }, []);

  const handleError = useCallback((err: unknown, initial: boolean) => {
    setError(err instanceof Error ? err.message : "Произошла ошибка");
    if (initial) setIsLoading(false);
  }, []);

  const loadData = useCallback(
    async (query?: string, isInitialLoad = false, page = 1) => {
      if (!isMountedRef.current) return;

      const requestKey = JSON.stringify({
        query: (query?.trim() ?? ""),
        filters,
        sortBy,
        sortDirection,
        tenantId: activeTenantId,
        ...(hasPagination ? { page } : {}),
      });

      if (!shouldStart(requestKey)) return;

      startLoading(isInitialLoad);

      try {
        const params = {
          query: query?.trim(),
          filterValues: filters,
          sortBy,
          sortDirection,
          tenantId: activeTenantId,
          ...(hasPagination ? { page } : {}),
        };
        const result = await fetchData(params);
        if (!isMountedRef.current || !isLatest(requestKey)) return;
        if (result?.error) {
          setError(result.error);
          setData([]);
          if (hasPagination) setTotalCount(0);
        } else {
          setError(null);
          const list = Array.isArray(result?.data) ? result.data : [];
          setData(list);
          if (hasPagination && result?.totalCount != null) {
            setTotalCount(result.totalCount);
          }
        }
        finishLoading(isInitialLoad);
      } catch (err) {
        if (isMountedRef.current && isLatest(requestKey)) {
          handleError(err, isInitialLoad);
          setData([]);
          if (hasPagination) setTotalCount(0);
        }
      } finally {
        finish(requestKey);
      }
    },
    [
      filters,
      sortBy,
      sortDirection,
      hasPagination,
      activeTenantId,
      fetchData,
      shouldStart,
      isLatest,
      finish,
      startLoading,
      finishLoading,
      handleError,
    ]
  );

  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    if (activeTenantId == null) {
      setData([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }
    if (hasPagination) {
      loadData(searchQuery, true, currentPage);
    } else {
      loadData(searchQuery, true);
    }
  }, [filtersKey, sortBy, sortDirection, currentPage, activeTenantId]);

  const refreshList = useCallback(() => {
    if (hasPagination) {
      loadData(searchQuery, false, currentPage);
    } else {
      loadData(searchQuery, false);
    }
  }, [loadData, searchQuery, hasPagination, currentPage]);

  const handleSearch = useCallback(
    (query: string) => {
      if (hasPagination) {
        setUrlState({ page: 1 });
        loadData(query || undefined, false, 1);
      } else {
        loadData(query || undefined, false);
      }
    },
    [loadData, hasPagination, setUrlState]
  );

  useDebouncedSearch(searchQuery, handleSearch, { skipInitial: true });

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUrlState({ search: e.target.value });
    },
    [setUrlState]
  );

  const totalPages = hasPagination ? Math.ceil(totalCount / pageSize) : 1;
  const goToPage = useCallback(
    (page: number) => {
      setUrlState({ page });
      loadData(searchQuery, false, page);
    },
    [loadData, searchQuery, setUrlState]
  );

  const pagination: ListPagePagination | undefined = hasPagination
    ? {
        totalCount,
        pageSize,
        totalPages,
        currentPage,
        goToPage,
      }
    : undefined;

  const isAddFormOpen = hasAddForm ? addFormOpen : false;

  const handleAddFormOpenChange = useCallback((open: boolean) => {
    setAddFormOpen(open);
  }, []);

  const handleEntityAdded = useCallback(() => {
    refreshList();
  }, [refreshList]);


  const resultsCount = Array.isArray(data) ? data.length : 0;

  const activeFiltersCount = (() => {
    let count = 0;
    const init = initialFilters as Record<string, unknown>;
    const current = filters as Record<string, unknown>;
    for (const key of Object.keys(current)) {
      if (!deepEqual(current[key], init[key])) count++;
    }
    return count;
  })();

  const setFiltersAndUrl = useCallback(
    (newFilters: Filters) => {
      setUrlState({
        ...filtersToUrlState(newFilters, initialFilters),
        ...(hasPagination ? { page: 1 } : {}),
      });
    },
    [setUrlState, initialFilters, hasPagination]
  );

  const setSortAndUrl = useCallback(
    (newSort: EntitySortOption) => {
      const { sortBy, sortDirection } = getEntitySortParams(newSort);
      setUrlState({ sortBy, sortDirection, ...(hasPagination ? { page: 1 } : {}) });
    },
    [setUrlState, hasPagination]
  );

  const resetFilters = useCallback(() => {
    setFiltersAndUrl(initialFilters);
  }, [setFiltersAndUrl, initialFilters]);

  const baseReturn = {
    data,
    isLoading,
    error,
    searchQuery,
    setSearchQuery: (q: string) => setUrlState({ search: q }),
    handleSearchChange,
    sort,
    setSort: setSortAndUrl,
    filters,
    setFilters: setFiltersAndUrl,
    resetFilters,
    isFiltersOpen,
    setIsFiltersOpen,
    resultsCount,
    results,
    activeFiltersCount,
    filterFields,
    columns,
    addForm,
    icon,
    getName,
    labels,
    kind,
    basePath,
    apiTable,
    counts,
    groupBy: config.groupBy,
    groupByEmptyLabel: config.groupByEmptyLabel,
    refreshList,
  };

  return {
    ...baseReturn,
    pagination,
    ...(hasAddForm && {
      isAddFormOpen,
      handleAddFormOpenChange,
      handleEntityAdded,
    }),
  };
}
