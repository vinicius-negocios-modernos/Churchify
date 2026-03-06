import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useClipboard } from '@/hooks/useClipboard';

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default: navigator.clipboard available
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with copied=false and no error', () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('copies text using navigator.clipboard.writeText', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('hello');
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('resets copied to false after 2 seconds', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('hello');
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it('falls back to document.execCommand when clipboard API is unavailable', async () => {
    // Remove clipboard API
    Object.assign(navigator, { clipboard: undefined });

    const mockExecCommand = vi.fn().mockReturnValue(true);
    document.execCommand = mockExecCommand;

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('fallback text');
    });

    expect(mockExecCommand).toHaveBeenCalledWith('copy');
    expect(result.current.copied).toBe(true);
  });

  it('sets error when copy fails', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test');
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBe('Permission denied');
  });

  it('handles non-Error rejection in copy', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue('some string error'),
      },
    });

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test');
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBe('Falha ao copiar');
  });

  it('clears previous timeout on rapid successive copies', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('first');
    });
    expect(result.current.copied).toBe(true);

    // Copy again before timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await result.current.copy('second');
    });
    expect(result.current.copied).toBe(true);

    // After 2 more seconds, should reset
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });
});
