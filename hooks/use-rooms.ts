"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Room {
  id: number;
  name: string | null;
}

export const useRooms = (includeDeleted = false) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

      if (fetchError) throw fetchError;
      setRooms(data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Ошибка загрузки помещений");
      setError(error);
      console.error("Ошибка загрузки помещений:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [includeDeleted]);

  return { rooms, isLoading, error, refetch: loadRooms };
};
