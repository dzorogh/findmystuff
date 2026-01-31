"use client";

import { useState, useEffect, useRef } from "react";
import { getPlacesSimple } from "@/lib/places/api";
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
      const response = await getPlacesSimple(includeDeleted);
      if (!isMountedRef.current) return;
      if (response.error) throw new Error(response.error);
      setPlaces(response.data || []);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err : new Error("Ошибка загрузки мест"));
      console.error("Ошибка загрузки мест:", err);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadPlaces();
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPlaces stable, mount-only effect
  }, [includeDeleted]);

  return { places, isLoading, error, refetch: loadPlaces };
};
