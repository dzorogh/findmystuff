"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Place {
  id: number;
  name: string | null;
}

export const usePlaces = (includeDeleted = false) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPlaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from("places")
        .select("id, name")
        .order("name", { ascending: true, nullsFirst: false });

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPlaces(data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Ошибка загрузки мест");
      setError(error);
      console.error("Ошибка загрузки мест:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, [includeDeleted]);

  return { places, isLoading, error, refetch: loadPlaces };
};
