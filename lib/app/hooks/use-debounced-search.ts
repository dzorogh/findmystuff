"use client";

import { useRef, useEffect } from "react";

const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Вызывает onSearch с задержкой при изменении searchQuery.
 * skipInitial: не вызывать onSearch при первом монтировании.
 */
export function useDebouncedSearch(
  searchQuery: string,
  onSearch: (query: string) => void,
  options: { delay?: number; skipInitial?: boolean } = {}
) {
  const { delay = DEFAULT_DEBOUNCE_MS, skipInitial = true } = options;
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
