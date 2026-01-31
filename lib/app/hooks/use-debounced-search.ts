"use client";

import { useEffect, useRef } from "react";

interface UseDebouncedSearchProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  delay?: number;
  skipInitial?: boolean;
}

export const useDebouncedSearch = ({
  searchQuery,
  onSearch,
  delay = 300,
  skipInitial = true,
}: UseDebouncedSearchProps) => {
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
      const query = searchQuery.trim() || "";
      onSearchRef.current(query);
    }, delay);
    timerRef.current = timer;
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [searchQuery, delay, skipInitial]);
};
