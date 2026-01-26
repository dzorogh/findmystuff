"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { Place } from "@/types/entity";

export const usePlaces = (includeDeleted = false) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const loadPlaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPlacesSimple(includeDeleted);

      if (!isMountedRef.current) return;

      if (response.error) throw new Error(response.error);
      // API возвращает полные объекты Place[], используем их напрямую
      setPlaces(response.data || []);
    } catch (err) {
      if (!isMountedRef.current) return;
      const error = err instanceof Error ? err : new Error("Ошибка загрузки мест");
      setError(error);
      console.error("Ошибка загрузки мест:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadPlaces();
    return () => {
      isMountedRef.current = false;
    };
  }, [includeDeleted]);

  return { places, isLoading, error, refetch: loadPlaces };
};
