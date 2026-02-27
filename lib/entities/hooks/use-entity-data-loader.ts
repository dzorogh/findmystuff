import { useEffect, useRef } from "react";

interface UseEntityDataLoaderOptions {
  entityId: number;
  loadData: () => Promise<void>;
}

/**
 * Guard-хук для загрузки данных сущности по entityId.
 * Предотвращает повторный запуск loadData, пока предыдущий запрос не завершён;
 * при смене entityId сбрасывает флаг и запускает загрузку заново.
 * Состояние загрузки и результат полностью управляются снаружи (loadData и вызывающий код).
 */
export const useEntityDataLoader = ({
  entityId,
  loadData,
}: UseEntityDataLoaderOptions) => {
  const loadingRef = useRef(false);
  const lastLoadKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    const loadKey = `${entityId}`;
    const currentRequestId = ++requestIdRef.current;

    if (lastLoadKeyRef.current === loadKey && loadingRef.current) return;
    if (lastLoadKeyRef.current !== loadKey) {
      loadingRef.current = false;
      lastLoadKeyRef.current = loadKey;
    }
    if (loadingRef.current) return;

    loadingRef.current = true;
    let isCancelled = false;
    const loadPromise = loadData();

    Promise.resolve(loadPromise).finally(() => {
      if (!isCancelled && currentRequestId === requestIdRef.current) {
        loadingRef.current = false;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [entityId, loadData]);
};
