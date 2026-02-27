"use client";

import { useRef, useCallback } from "react";

/**
 * Хук для предотвращения дублирования параллельных запросов.
 * Держит текущий ключ запроса и флаг загрузки; shouldStart разрешает запуск только если ключ новый или предыдущий завершён.
 */
export function useRequestKey() {
  const isLoadingRef = useRef(false);
  const requestKeyRef = useRef("");

  const shouldStart = useCallback((key: string) => {
    if (isLoadingRef.current && requestKeyRef.current === key) return false;
    isLoadingRef.current = true;
    requestKeyRef.current = key;
    return true;
  }, []);

  const isLatest = useCallback((key: string) => requestKeyRef.current === key, []);
  const finish = useCallback((key: string) => {
    if (requestKeyRef.current === key) {
      isLoadingRef.current = false;
      requestKeyRef.current = "";
    }
  }, []);

  return { shouldStart, isLatest, finish };
}
