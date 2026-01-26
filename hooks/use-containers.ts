"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { Container } from "@/types/entity";

export const useContainers = (includeDeleted = false) => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const loadContainers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getContainersSimple(includeDeleted);

      if (!isMountedRef.current) return;

      if (response.error) throw new Error(response.error);
      setContainers((response.data || []).map((container: Container) => ({
        id: container.id,
        name: container.name,
        entity_type_id: container.entity_type_id || null,
        entity_type: container.entity_type ? {
          code: container.entity_type.code,
          name: container.entity_type.name,
        } : null,
        marking_number: container.marking_number,
      })));
    } catch (err) {
      if (!isMountedRef.current) return;
      const error = err instanceof Error ? err : new Error("Ошибка загрузки контейнеров");
      setError(error);
      console.error("Ошибка загрузки контейнеров:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadContainers();
    return () => {
      isMountedRef.current = false;
    };
  }, [includeDeleted]);

  return { containers, isLoading, error, refetch: loadContainers };
};
