"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { EntityType } from "@/types/entity";

// Глобальный кеш для отслеживания выполняющихся запросов и результатов
const loadingRequests = new Map<string, Promise<{ types: EntityType[]; error: string | null }>>();
const requestResults = new Map<string, { types: EntityType[]; error: string | null }>();

export const useEntityTypes = (category?: "place" | "container") => {
  const [types, setTypes] = useState<EntityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestKey = category || "all";

  useEffect(() => {
    const loadTypes = async () => {
      // Проверяем, есть ли уже результат в кеше
      if (requestResults.has(requestKey)) {
        const cached = requestResults.get(requestKey)!;
        setTypes(cached.types);
        setError(cached.error);
        setIsLoading(false);
        return;
      }

      // Проверяем, выполняется ли уже такой же запрос
      if (loadingRequests.has(requestKey)) {
        setIsLoading(true);
        try {
          const result = await loadingRequests.get(requestKey)!;
          setTypes(result.types);
          setError(result.error);
        } catch {
          // Игнорируем ошибки, они уже обработаны в основном запросе
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      // Создаем промис для запроса
      const requestPromise = (async () => {
        try {
          const response = await apiClient.getEntityTypes(category);
          if (response.error) {
            throw new Error(response.error);
          }
          // API возвращает { data: EntityType[] }
          // request возвращает это напрямую, поэтому response будет { data: EntityType[] }
          // И response.data будет EntityType[]
          const loadedTypes = (response.data as EntityType[]) || [];
          const result = { types: loadedTypes, error: null };
          
          // Сохраняем результат в кеш
          requestResults.set(requestKey, result);
          
          return result;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Ошибка загрузки типов";
          const result = { types: [], error: errorMessage };
          
          // Сохраняем ошибку в кеш
          requestResults.set(requestKey, result);
          
          return result;
        } finally {
          // Удаляем запрос из списка выполняющихся
          loadingRequests.delete(requestKey);
        }
      })();

      // Сохраняем промис в список выполняющихся запросов
      loadingRequests.set(requestKey, requestPromise);

      try {
        const result = await requestPromise;
        setTypes(result.types);
        setError(result.error);
      } catch {
        // Ошибки уже обработаны в промиссе
      } finally {
        setIsLoading(false);
      }
    };

    loadTypes();
  }, [category, requestKey]);

  return { types, isLoading, error };
};
