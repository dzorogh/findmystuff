"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DEFAULT_ENTITY_SORT, getEntitySortParams, type EntitySortOption } from "@/lib/entities/helpers/sort";
import type { EntityConfig, EntityDisplay, Filters, Results } from "@/lib/app/types/entity-config";

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
  const {
    filters: filtersConfig,
    columns,
    actions,
    addForm,
    labels,
    icon,
    getName,
    fetch: fetchData,
    pagination,
    kind,
    basePath,
    apiTable,
  } = config;

  const filterFields = filtersConfig.fields;
  const initialFilters = filtersConfig.initial;
  const results = labels.results;
  const hasPagination = pagination != null;
  const hasAddForm = addForm != null;

  const pageSize = hasPagination ? pagination.pageSize : 20;

  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<EntitySortOption>(DEFAULT_ENTITY_SORT);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EntityDisplay[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
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
          ...(hasPagination ? { page } : {}),
        };
        const result = await fetchData(params);
        if (!isMountedRef.current || !isLatest(requestKey)) return;
        const list = Array.isArray(result?.data) ? result.data : [];
        setData(list);
        if (hasPagination && result?.totalCount != null) {
          setTotalCount(result.totalCount);
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
    if (hasPagination) {
      setCurrentPage(1);
      loadData(searchQuery, true, 1);
    } else {
      loadData(searchQuery, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, sortBy, sortDirection]);

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
        setCurrentPage(1);
        loadData(query || undefined, false, 1);
      } else {
        loadData(query || undefined, false);
      }
    },
    [loadData, hasPagination]
  );

  useDebouncedSearch(searchQuery, handleSearch, { skipInitial: true });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const totalPages = hasPagination ? Math.ceil(totalCount / pageSize) : 1;
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      loadData(searchQuery, false, page);
    },
    [loadData, searchQuery]
  );

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
      if (current[key] !== init[key]) count++;
    }
    return count;
  })();

  const baseReturn = {
    data,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    sort,
    setSort,
    filters,
    setFilters,
    isFiltersOpen,
    setIsFiltersOpen,
    resultsCount,
    results,
    activeFiltersCount,
    filterFields,
    columns,
    actions,
    addForm,
    icon,
    getName,
    labels,
    kind,
    basePath,
    apiTable,
    refreshList,
  };

  return {
    ...baseReturn,
    ...(hasPagination && {
      currentPage,
      totalPages,
      totalCount,
      goToPage,
      pageSize,
    }),
    ...(hasAddForm && {
      isAddFormOpen,
      handleAddFormOpenChange,
      handleEntityAdded,
    }),
  };
}
