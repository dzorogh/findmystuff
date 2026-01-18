"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface EntityType {
  id: number;
  entity_category: "place" | "container";
  code: string;
  name: string;
  created_at: string;
  deleted_at: string | null;
}

export const useEntityTypes = (category?: "place" | "container") => {
  const [types, setTypes] = useState<EntityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTypes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        let query = supabase
          .from("entity_types")
          .select("*")
          .is("deleted_at", null)
          .order("code", { ascending: true });

        if (category) {
          query = query.eq("entity_category", category);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setTypes((data as EntityType[]) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки типов");
        setTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTypes();
  }, [category]);

  return { types, isLoading, error };
};
