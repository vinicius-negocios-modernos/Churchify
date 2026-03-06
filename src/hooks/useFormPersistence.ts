import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to persist form data in sessionStorage.
 * Values are restored on mount and cleared on successful submission.
 *
 * @param key - Unique storage key for the form
 * @param initialValue - Default form state
 * @returns [value, setValue, clearPersisted]
 */
export function useFormPersistence<T extends object>(
  key: string,
  initialValue: T,
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        // Merge with initial to handle schema changes
        return { ...initialValue, ...parsed };
      }
    } catch {
      // Corrupted data — fall back to initial
    }
    return initialValue;
  });

  // Persist to sessionStorage on every change
  useEffect(() => {
    try {
      // Filter out non-serializable values (File objects, etc.)
      const serializable: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (v instanceof File || v instanceof Blob) continue;
        serializable[k] = v;
      }
      sessionStorage.setItem(key, JSON.stringify(serializable));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [key, value]);

  const clearPersisted = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Silently ignore
    }
  }, [key]);

  return [value, setValue, clearPersisted];
}
