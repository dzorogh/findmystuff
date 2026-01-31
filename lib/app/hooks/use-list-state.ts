"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/users/context";

interface UseListStateProps {
  externalSearchQuery?: string;
  externalShowDeleted?: boolean;
  refreshTrigger?: number;
  onSearchStateChange?: (state: { isSearching: boolean; resultsCount: number }) => void;
}

export const useListState = ({
  externalSearchQuery,
  externalShowDeleted,
  onSearchStateChange,
}: UseListStateProps = {}) => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalSearch] = useState("");
  const [internalShowDeleted] = useState(false);

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearch;
  const showDeleted = externalShowDeleted !== undefined ? externalShowDeleted : internalShowDeleted;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const updateSearchState = (isSearchingValue: boolean, resultsCount: number) => {
    setIsSearching(isSearchingValue);
    if (onSearchStateChange) {
      onSearchStateChange({ isSearching: isSearchingValue, resultsCount });
    }
  };

  const startLoading = (isInitialLoad: boolean) => {
    setIsSearching(true);
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);
  };

  const finishLoading = (isInitialLoad: boolean, resultsCount: number) => {
    setIsSearching(false);
    updateSearchState(false, resultsCount);
    if (isInitialLoad) {
      setIsLoading(false);
    }
  };

  const handleError = (err: unknown, isInitialLoad: boolean) => {
    const errorMessage = err instanceof Error ? err.message : "Произошла ошибка";
    setError(errorMessage);
    updateSearchState(false, 0);
    if (isInitialLoad) {
      setIsLoading(false);
    }
  };

  return {
    user,
    isUserLoading,
    isLoading,
    isSearching,
    error,
    searchQuery,
    showDeleted,
    setError,
    startLoading,
    finishLoading,
    handleError,
    updateSearchState,
  };
};
