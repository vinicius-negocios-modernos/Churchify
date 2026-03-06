import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetEpisodes = vi.fn();
const mockGetEpisodesByChurch = vi.fn();

vi.mock('@/services/episodeService', () => ({
  getEpisodes: (...args: unknown[]) => mockGetEpisodes(...args),
  getEpisodesByChurch: (...args: unknown[]) => mockGetEpisodesByChurch(...args),
}));

import { useEpisodes } from '@/hooks/useEpisodes';

const sampleEpisodes = [
  { id: 'ep-1', title: 'Episode 1', church_id: 'church-1', status: 'completed' },
  { id: 'ep-2', title: 'Episode 2', church_id: 'church-1', status: 'processing' },
];

describe('useEpisodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEpisodes.mockResolvedValue(sampleEpisodes);
    mockGetEpisodesByChurch.mockResolvedValue(sampleEpisodes);
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useEpisodes());
    expect(result.current.loading).toBe(true);
    expect(result.current.episodes).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches all episodes when no churchId is provided', async () => {
    const { result } = renderHook(() => useEpisodes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetEpisodes).toHaveBeenCalledOnce();
    expect(mockGetEpisodesByChurch).not.toHaveBeenCalled();
    expect(result.current.episodes).toEqual(sampleEpisodes);
    expect(result.current.error).toBeNull();
  });

  it('fetches episodes by church when churchId is provided', async () => {
    const { result } = renderHook(() => useEpisodes({ churchId: 'church-1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetEpisodesByChurch).toHaveBeenCalledWith('church-1');
    expect(mockGetEpisodes).not.toHaveBeenCalled();
    expect(result.current.episodes).toEqual(sampleEpisodes);
  });

  it('handles fetch error gracefully', async () => {
    mockGetEpisodes.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEpisodes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.episodes).toEqual([]);
  });

  it('handles non-Error rejection', async () => {
    mockGetEpisodes.mockRejectedValue('string error');

    const { result } = renderHook(() => useEpisodes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch episodes');
  });

  it('refetch re-fetches data', async () => {
    const { result } = renderHook(() => useEpisodes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetEpisodes).toHaveBeenCalledTimes(1);

    // Trigger refetch
    mockGetEpisodes.mockResolvedValue([sampleEpisodes[0]]);
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.episodes).toHaveLength(1);
    });

    expect(mockGetEpisodes).toHaveBeenCalledTimes(2);
  });

  it('re-fetches when churchId changes', async () => {
    const { result, rerender } = renderHook(
      ({ churchId }) => useEpisodes({ churchId }),
      { initialProps: { churchId: 'church-1' as string | undefined } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetEpisodesByChurch).toHaveBeenCalledWith('church-1');

    rerender({ churchId: 'church-2' });

    await waitFor(() => {
      expect(mockGetEpisodesByChurch).toHaveBeenCalledWith('church-2');
    });
  });
});
