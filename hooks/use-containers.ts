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
      // API возвращает полные объекты Container[], используем их напрямую
      setContainers(response.data || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadContainers stable, mount-only effect
  }, [includeDeleted]);

  return { containers, isLoading, error, refetch: loadContainers };
};
