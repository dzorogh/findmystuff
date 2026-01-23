"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Room {
  id: number;
  name: string | null;
}

export const useRooms = (includeDeleted = false) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const loadRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from("rooms")
        .select("id, name")
        .order("name", { ascending: true, nullsFirst: false });

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data, error: fetchError } = await query;

      if (!isMountedRef.current) return;

      if (fetchError) throw fetchError;
      setRooms(data || []);
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
  }, [includeDeleted]);

  return { rooms, isLoading, error, refetch: loadRooms };
};
