"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Place {
  id: number;
  name: string | null;
}

export const usePlaces = (includeDeleted = false) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

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

      if (!isMountedRef.current) return;

      if (fetchError) throw fetchError;
      setPlaces(data || []);
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
