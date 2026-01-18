"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Container {
  id: number;
  name: string | null;
  container_type: string | null;
  marking_number: number | null;
}

export const useContainers = (includeDeleted = false) => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadContainers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from("containers")
        .select("id, name, container_type, marking_number")
        .order("name", { ascending: true, nullsFirst: false });

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setContainers(data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Ошибка загрузки контейнеров");
      setError(error);
      console.error("Ошибка загрузки контейнеров:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContainers();
  }, [includeDeleted]);

  return { containers, isLoading, error, refetch: loadContainers };
};
