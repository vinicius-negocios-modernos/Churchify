interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface Cache<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
  invalidate(key: string): void;
  clear(): void;
}

export function createCache<T>(ttlMs: number): Cache<T> {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key: string): T | null {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },

    set(key: string, value: T): void {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    },

    invalidate(key: string): void {
      store.delete(key);
    },

    clear(): void {
      store.clear();
    },
  };
}
