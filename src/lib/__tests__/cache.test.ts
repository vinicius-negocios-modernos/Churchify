import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCache } from '@/lib/cache';

describe('createCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for a missing key', () => {
    const cache = createCache<string>(5000);
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    const cache = createCache<string>(5000);
    cache.set('key1', 'hello');
    expect(cache.get('key1')).toBe('hello');
  });

  it('stores complex objects', () => {
    const cache = createCache<{ count: number; items: string[] }>(5000);
    const value = { count: 3, items: ['a', 'b', 'c'] };
    cache.set('data', value);
    expect(cache.get('data')).toEqual(value);
  });

  it('returns null after TTL expires', () => {
    const cache = createCache<string>(1000); // 1 second TTL
    cache.set('key1', 'hello');

    // Still valid before TTL
    vi.advanceTimersByTime(999);
    expect(cache.get('key1')).toBe('hello');

    // Expired after TTL
    vi.advanceTimersByTime(2);
    expect(cache.get('key1')).toBeNull();
  });

  it('invalidates a specific key', () => {
    const cache = createCache<string>(5000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.invalidate('key1');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  it('clears all entries', () => {
    const cache = createCache<string>(5000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    cache.clear();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key3')).toBeNull();
  });

  it('overwrites existing key with new value and resets TTL', () => {
    const cache = createCache<string>(1000);
    cache.set('key1', 'old');

    vi.advanceTimersByTime(800);
    cache.set('key1', 'new');

    // 800ms more — original would have expired, but reset should keep it
    vi.advanceTimersByTime(800);
    expect(cache.get('key1')).toBe('new');
  });
});
