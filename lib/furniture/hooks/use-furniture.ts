"use client";

import { useState, useEffect, useCallback } from "react";
import { getFurnitureSimple } from "@/lib/furniture/api";
import { createSimpleListCache } from "@/lib/shared/cache/simple-list-cache";
import type { Furniture } from "@/types/entity";

const furnitureCache = createSimpleListCache<Furniture>();

export const useFurniture = (includeDeleted = false) => {
  const key = String(includeDeleted);
  const cached = furnitureCache.get(key);

  const [furniture, setFurniture] = useState<Furniture[]>(cached?.data ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(cached?.error ?? null);

  useEffect(() => {
    const notify = (data: Furniture[], err: Error | null) => {
      setFurniture(data);
      setError(err);
      setIsLoading(false);
    };

    const unsubscribe = furnitureCache.subscribe(key, notify);
    furnitureCache.load(key, async () => {
      const res = await getFurnitureSimple(includeDeleted);
      return {
        data: res.data ?? null,
        error: res.error ?? undefined,
      };
    });
    return unsubscribe;
  }, [key, includeDeleted]);

  const refetch = useCallback(() => {
    furnitureCache.invalidate(key);
    setIsLoading(true);
    setError(null);
    furnitureCache.load(key, async () => {
      const res = await getFurnitureSimple(includeDeleted);
      return { data: res.data ?? null, error: res.error };
    });
  }, [key, includeDeleted]);

  return { furniture, isLoading, error, refetch };
};
