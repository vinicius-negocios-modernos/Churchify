import { useState, useEffect, useCallback } from 'react';
import { getEpisodes, getEpisodesByChurch } from '@/services/episodeService';
import type { Episode } from '@/types/database';

interface UseEpisodesOptions {
  churchId?: string;
}

interface UseEpisodesReturn {
  episodes: Episode[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEpisodes(options: UseEpisodesOptions = {}): UseEpisodesReturn {
  const { churchId } = options;
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = churchId
        ? await getEpisodesByChurch(churchId)
        : await getEpisodes();
      setEpisodes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch episodes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  return { episodes, loading, error, refetch: fetchEpisodes };
}
