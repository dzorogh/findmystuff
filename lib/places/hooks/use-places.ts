"use client";

import { useState, useEffect, useCallback } from "react";
import { getPlacesSimple } from "@/lib/places/api";
import { createSimpleListCache } from "@/lib/shared/cache/simple-list-cache";
import type { Place } from "@/types/entity";

const placesCache = createSimpleListCache<Place>();

export const usePlaces = (includeDeleted = false) => {
  const key = String(includeDeleted);
  const cached = placesCache.get(key);

  const [places, setPlaces] = useState<Place[]>(cached?.data ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(cached?.error ?? null);

  useEffect(() => {
    const notify = (data: Place[], err: Error | null) => {
      setPlaces(data);
      setError(err);
      setIsLoading(false);
    };

    const unsubscribe = placesCache.subscribe(key, notify);
    placesCache.load(key, async () => {
      const res = await getPlacesSimple(includeDeleted);
      return { data: res.data ?? null, error: res.error };
    });
    return unsubscribe;
  }, [key, includeDeleted]);

  const refetch = useCallback(() => {
    placesCache.invalidate(key);
    setIsLoading(true);
    setError(null);
    placesCache.load(key, async () => {
      const res = await getPlacesSimple(includeDeleted);
      return { data: res.data ?? null, error: res.error };
    });
  }, [key, includeDeleted]);

  return { places, isLoading, error, refetch };
};
