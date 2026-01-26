"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { EntityType } from "@/types/entity";

export const useEntityTypes = (category?: "place" | "container") => {
  const [types, setTypes] = useState<EntityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTypes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.getEntityTypes(category);
        if (response.error) {
          throw new Error(response.error);
        }
        setTypes((response.data?.data as EntityType[]) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки типов");
        setTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTypes();
  }, [category]);

  return { types, isLoading, error };
};
