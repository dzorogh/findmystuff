import { useEffect, useRef } from "react";

interface UseEntityDataLoaderOptions {
  entityId: number;
  loadData: () => Promise<void>;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);
};
