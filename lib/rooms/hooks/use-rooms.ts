"use client";

import { useState, useEffect, useCallback } from "react";
import { getRoomsSimple } from "@/lib/rooms/api";
import { createSimpleListCache } from "@/lib/shared/cache/simple-list-cache";
import type { Room } from "@/types/entity";

const roomsCache = createSimpleListCache<Room>();

export const useRooms = (includeDeleted = false) => {
  const key = String(includeDeleted);
  const cached = roomsCache.get(key);

  const [rooms, setRooms] = useState<Room[]>(cached?.data ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(cached?.error ?? null);

  useEffect(() => {
    const notify = (data: Room[], err: Error | null) => {
      setRooms(data);
      setError(err);
      setIsLoading(false);
    };

    const unsubscribe = roomsCache.subscribe(key, notify);
    roomsCache.load(key, async () => {
      const res = await getRoomsSimple(includeDeleted);
      return { 
        data: res.data ?? null, 
        error: res.error ? new Error(res.error) : null 
      };
    });
    return unsubscribe;
  }, [key, includeDeleted]);

  const refetch = useCallback(() => {
    roomsCache.invalidate(key);
    setIsLoading(true);
    setError(null);
    roomsCache.load(key, async () => {
      const res = await getRoomsSimple(includeDeleted);
      return { data: res.data ?? null, error: res.error };
    });
  }, [key, includeDeleted]);

  return { rooms, isLoading, error, refetch };
};
