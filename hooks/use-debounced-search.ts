"use client";

import { useEffect, useRef } from "react";

interface UseDebouncedSearchProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  delay?: number;
}

export const useDebouncedSearch = ({
  searchQuery,
  onSearch,
  delay = 300,
}: UseDebouncedSearchProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

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
  }, [searchQuery, delay]);
};
