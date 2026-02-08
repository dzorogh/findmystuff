"use client";

import { useState, useEffect, useCallback } from "react";
import { getContainersSimple } from "@/lib/containers/api";
import { createSimpleListCache } from "@/lib/shared/cache/simple-list-cache";
import type { Container } from "@/types/entity";

const containersCache = createSimpleListCache<Container>();

export const useContainers = (includeDeleted = false) => {
  const key = String(includeDeleted);
  const cached = containersCache.get(key);

  const [containers, setContainers] = useState<Container[]>(cached?.data ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(cached?.error ?? null);

  useEffect(() => {
    const notify = (data: Container[], err: Error | null) => {
      setContainers(data);
      setError(err);
      setIsLoading(false);
    };

    const unsubscribe = containersCache.subscribe(key, notify);
    containersCache.load(key, async () => {
      const res = await getContainersSimple(includeDeleted);
      return { data: res.data ?? null, error: res.error };
    });
    return unsubscribe;
  }, [key, includeDeleted]);

  const refetch = useCallback(() => {
    containersCache.invalidate(key);
    setIsLoading(true);
    setError(null);
    containersCache.load(key, async () => {
      const res = await getContainersSimple(includeDeleted);
      return { data: res.data ?? null, error: res.error };
    });
  }, [key, includeDeleted]);

  return { containers, isLoading, error, refetch };
};
