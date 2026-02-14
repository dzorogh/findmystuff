"use client";

import { useState, useEffect, useCallback } from "react";
import { getBuildingsSimple } from "@/lib/buildings/api";
import { createSimpleListCache } from "@/lib/shared/cache/simple-list-cache";
import type { Building } from "@/types/entity";

const buildingsCache = createSimpleListCache<Building>();

export const useBuildings = (includeDeleted = false) => {
  const key = String(includeDeleted);
  const cached = buildingsCache.get(key);

  const [buildings, setBuildings] = useState<Building[]>(cached?.data ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(cached?.error ?? null);

  useEffect(() => {
    const notify = (data: Building[], err: Error | null) => {
      setBuildings(data);
      setError(err);
      setIsLoading(false);
    };

    const unsubscribe = buildingsCache.subscribe(key, notify);
    buildingsCache.load(key, async () => {
      const res = await getBuildingsSimple(includeDeleted);
      return {
        data: res.data ?? null,
        error: res.error ?? undefined,
      };
    });
    return unsubscribe;
  }, [key, includeDeleted]);

  const refetch = useCallback(() => {
    buildingsCache.invalidate(key);
    setIsLoading(true);
    setError(null);
    buildingsCache.load(key, async () => {
      const res = await getBuildingsSimple(includeDeleted);
      return { data: res.data ?? null, error: res.error };
    });
  }, [key, includeDeleted]);

  return { buildings, isLoading, error, refetch };
};
