"use client";

import { useState, useEffect } from "react";
import { getEntityTypes } from "@/lib/entities/api";
import type { EntityType } from "@/types/entity";

const loadingRequests = new Map<string, Promise<{ types: EntityType[]; error: string | null }>>();
const requestResults = new Map<string, { types: EntityType[]; error: string | null }>();

export const clearEntityTypesCache = () => {
  loadingRequests.clear();
  requestResults.clear();
};

export const useEntityTypes = (category?: "place" | "container") => {
  const [types, setTypes] = useState<EntityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestKey = category || "all";

  useEffect(() => {
    const loadTypes = async () => {
      if (requestResults.has(requestKey)) {
        const cached = requestResults.get(requestKey)!;
        setTypes(cached.types);
        setError(cached.error);
        setIsLoading(false);
        return;
      }

      if (loadingRequests.has(requestKey)) {
        setIsLoading(true);
        try {
          const result = await loadingRequests.get(requestKey)!;
          setTypes(result.types);
          setError(result.error);
        } catch {
          // ignore
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      const requestPromise = (async () => {
        try {
          const response = await getEntityTypes(category);
          if (response.error) throw new Error(response.error);
          const loadedTypes = (response.data as EntityType[]) || [];
          const result = { types: loadedTypes, error: null };
          requestResults.set(requestKey, result);
          return result;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Ошибка загрузки типов";
          const result = { types: [], error: errorMessage };
          requestResults.set(requestKey, result);
          return result;
        } finally {
          loadingRequests.delete(requestKey);
        }
      })();

      loadingRequests.set(requestKey, requestPromise);

      try {
        const result = await requestPromise;
        setTypes(result.types);
        setError(result.error);
      } catch {
        // errors handled in promise
      } finally {
        setIsLoading(false);
      }
    };

    loadTypes();
  }, [category, requestKey]);

  return { types, isLoading, error };
};
