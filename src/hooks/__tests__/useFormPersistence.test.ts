import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useFormPersistence } from '@/hooks/useFormPersistence';

const STORAGE_KEY = 'test-form';

describe('useFormPersistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns initial value when no stored data exists', () => {
    const { result } = renderHook(() =>
      useFormPersistence(STORAGE_KEY, { name: '', email: '' }),
    );

    expect(result.current[0]).toEqual({ name: '', email: '' });
  });

  it('restores value from sessionStorage on mount', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'John', email: 'john@test.com' }));

    const { result } = renderHook(() =>
      useFormPersistence(STORAGE_KEY, { name: '', email: '' }),
    );

    expect(result.current[0]).toEqual({ name: 'John', email: 'john@test.com' });
  });

  it('merges stored data with initial value for schema migration', () => {
    // Stored data has only "name", initial has "name" + "email"
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'John' }));

    const { result } = renderHook(() =>
      useFormPersistence(STORAGE_KEY, { name: '', email: 'default@test.com' }),
    );

    expect(result.current[0]).toEqual({ name: 'John', email: 'default@test.com' });
  });

  it('persists value to sessionStorage on updates', () => {
    const { result } = renderHook(() =>
      useFormPersistence(STORAGE_KEY, { name: '', email: '' }),
    );

    act(() => {
      result.current[1]({ name: 'Jane', email: 'jane@test.com' });
    });

    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored).toEqual({ name: 'Jane', email: 'jane@test.com' });
  });

  it('supports updater function pattern', () => {
    const { result } = renderHook(() =>
      useFormPersistence(STORAGE_KEY, { name: '', count: 0 }),
    );

    act(() => {
      result.current[1]((prev) => ({ ...prev, count: prev.count + 1 }));
    });

    expect(result.current[0].count).toBe(1);
  });

  it('clearPersisted removes from sessionStorage', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'John' }));

    const { result } = renderHook(() =>
      useFormPersistence(STORAGE_KEY, { name: '' }),
    );

    act(() => {
      result.current[2](); // clearPersisted
    });

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('handles corrupted sessionStorage data gracefully', () => {
    sessionStorage.setItem(STORAGE_KEY, 'not-json{{{');

    const { result } = renderHook(() =>
      useFormPersistence(STORAGE_KEY, { name: 'default' }),
    );

    expect(result.current[0]).toEqual({ name: 'default' });
  });

  it('filters out File/Blob objects when persisting', () => {
    const { result } = renderHook(() =>
      useFormPersistence(STORAGE_KEY, { name: '', file: null as File | null }),
    );

    act(() => {
      result.current[1]({ name: 'test', file: new File([''], 'test.txt') });
    });

    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored).toEqual({ name: 'test' });
    expect(stored.file).toBeUndefined();
  });
});
