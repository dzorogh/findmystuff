/**
 * Кэш с подпиской для дедупликации запросов списков (rooms, places, containers).
 * Несколько вызовов с одним ключом получают один запрос и общий результат.
 */

export interface CacheEntry<T> {
  data: T[];
  error: Error | null;
}

export interface SimpleListCache<T> {
  get(key: string): CacheEntry<T> | undefined;
  subscribe(key: string, notify: (data: T[], error: Error | null) => void): () => void;
  load(
    key: string,
    fetch: () => Promise<{ data: T[] | null; error?: string }>
  ): Promise<void>;
  invalidate(key: string): void;
}

function createSimpleListCache<T>(): SimpleListCache<T> {
  const cache = new Map<string, CacheEntry<T>>();
  const inFlight = new Map<string, Promise<void>>();
  const subscribers = new Map<string, Set<(data: T[], error: Error | null) => void>>();
  /** Версия ключа: инкрементируется при invalidate(key), чтобы отклонить устаревшие результаты in-flight. */
  const keyVersions = new Map<string, number>();

  return {
    get(key: string) {
      return cache.get(key);
    },

    subscribe(key: string, notify: (data: T[], error: Error | null) => void) {
      let set = subscribers.get(key);
      if (!set) {
        set = new Set();
        subscribers.set(key, set);
      }
      set.add(notify);
      return () => {
        set?.delete(notify);
      };
    },

    async load(
      key: string,
      fetchFn: () => Promise<{ data: T[] | null; error?: string }>
    ) {
      const existing = inFlight.get(key);
      if (existing) return existing;

      const loadVersion = keyVersions.get(key) ?? 0;

      const promise = (async () => {
        try {
          const response = await fetchFn();
          if ((keyVersions.get(key) ?? 0) !== loadVersion) return;
          if (response.error) throw new Error(response.error);
          const data = response.data ?? [];
          cache.set(key, { data, error: null });
          subscribers.get(key)?.forEach((fn) => fn(data, null));
        } catch (err) {
          if ((keyVersions.get(key) ?? 0) !== loadVersion) return;
          const error = err instanceof Error ? err : new Error("Ошибка загрузки");
          cache.set(key, { data: [], error });
          subscribers.get(key)?.forEach((fn) => fn([], error));
        } finally {
          inFlight.delete(key);
        }
      })();

      inFlight.set(key, promise);
      return promise;
    },

    invalidate(key: string) {
      keyVersions.set(key, (keyVersions.get(key) ?? 0) + 1);
      cache.delete(key);
      inFlight.delete(key);
    },
  };
}

export { createSimpleListCache };
