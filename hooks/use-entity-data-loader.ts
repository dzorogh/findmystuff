import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";

interface UseEntityDataLoaderOptions {
  user: User | null;
  isUserLoading: boolean;
  entityId: number;
  loadData: () => Promise<void>;
}

export const useEntityDataLoader = ({
  user,
  isUserLoading,
  entityId,
  loadData,
}: UseEntityDataLoaderOptions) => {
  const loadingRef = useRef(false);
  const lastLoadKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    if (!user || isUserLoading) {
      return;
    }

    const loadKey = `${user.id}-${entityId}`;
    const currentRequestId = ++requestIdRef.current;

    // Предотвращаем повторные запросы для тех же данных
    if (lastLoadKeyRef.current === loadKey && loadingRef.current) {
      return;
    }

    // Если это новый ключ загрузки, сбрасываем флаг загрузки
    if (lastLoadKeyRef.current !== loadKey) {
      loadingRef.current = false;
      lastLoadKeyRef.current = loadKey;
    }

    // Предотвращаем параллельные запросы
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    let isCancelled = false;
    
    const loadPromise = loadData();

    loadPromise.finally(() => {
      // Проверяем, что это все еще актуальный запрос
      if (!isCancelled && currentRequestId === requestIdRef.current) {
        loadingRef.current = false;
      }
    });

    return () => {
      isCancelled = true;
      // Не сбрасываем loadingRef здесь, чтобы предотвратить повторные вызовы
      // при размонтировании компонента во время загрузки в React Strict Mode
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isUserLoading, entityId]);
};
