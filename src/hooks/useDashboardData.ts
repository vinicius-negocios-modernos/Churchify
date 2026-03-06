import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { onDashboardRefresh } from '@/lib/dashboardEvents';
import type { Episode } from '@/types/database';
import type { Church } from '@/types/database';

export interface DashboardStats {
  totalEpisodes: number;
  episodesThisMonth: number;
  lastProcessedAt: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  recentEpisodes: Episode[];
  church: Pick<Church, 'name' | 'plan'> | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEpisodes: 0,
    episodesThisMonth: 0,
    lastProcessedAt: null,
  });
  const [recentEpisodes, setRecentEpisodes] = useState<Episode[]>([]);
  const [church, setChurch] = useState<Pick<Church, 'name' | 'plan'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all episodes for the user (via church membership)
      const { data: episodes, error: episodesError } = await supabase
        .from('episodes')
        .select('*')
        .order('created_at', { ascending: false });

      if (episodesError) {
        throw new Error(`Failed to fetch episodes: ${episodesError.message}`);
      }

      const allEpisodes = (episodes ?? []) as Episode[];

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const episodesThisMonth = allEpisodes.filter(
        (ep) => ep.created_at >= startOfMonth,
      ).length;

      const completedEpisodes = allEpisodes.filter((ep) => ep.status === 'completed');
      const lastProcessedAt =
        completedEpisodes.length > 0 ? completedEpisodes[0].created_at : null;

      setStats({
        totalEpisodes: allEpisodes.length,
        episodesThisMonth,
        lastProcessedAt,
      });

      // Recent episodes (limit 5)
      setRecentEpisodes(allEpisodes.slice(0, 5));

      // Fetch church info
      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .select('name, plan')
        .limit(1);

      if (churchError) {
        // Non-critical: church info is supplementary
        console.warn('Failed to fetch church info:', churchError.message);
      } else if (churchData && churchData.length > 0) {
        setChurch(churchData[0] as Pick<Church, 'name' | 'plan'>);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh when a new episode is created (Task 8)
  useEffect(() => {
    return onDashboardRefresh(fetchData);
  }, [fetchData]);

  return {
    stats,
    recentEpisodes,
    church,
    loading,
    error,
    refetch: fetchData,
  };
}
