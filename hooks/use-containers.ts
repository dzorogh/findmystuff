"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Container {
  id: number;
  name: string | null;
  entity_type_id: number | null;
  entity_type?: {
    code: string;
    name: string;
  } | null;
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
        .select("id, name, entity_type_id, marking_number, entity_types(code, name)")
        .order("name", { ascending: true, nullsFirst: false });

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setContainers((data || []).map((container: any) => ({
        id: container.id,
        name: container.name,
        entity_type_id: container.entity_type_id || null,
        entity_type: container.entity_types ? {
          code: container.entity_types.code,
          name: container.entity_types.name,
        } : null,
        marking_number: container.marking_number,
      })));
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
