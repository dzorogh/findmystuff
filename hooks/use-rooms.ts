"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import type { Room } from "@/types/entity";

export const useRooms = (includeDeleted = false) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const loadRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getRoomsSimple(includeDeleted);

      if (!isMountedRef.current) return;

      if (response.error) throw new Error(response.error);
      // API возвращает полные объекты Room[], используем их напрямую
      setRooms(response.data || []);
    } catch (err) {
      if (!isMountedRef.current) return;
      const error = err instanceof Error ? err : new Error("Ошибка загрузки помещений");
      setError(error);
      console.error("Ошибка загрузки помещений:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadRooms();
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadRooms stable, mount-only effect
  }, [includeDeleted]);

  return { rooms, isLoading, error, refetch: loadRooms };
};
