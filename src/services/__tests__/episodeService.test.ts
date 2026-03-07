import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockQueryBuilder,
  mockFrom,
} from '@/test/mocks/supabase';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase').then((m) => m.supabaseLibMock));

import {
  createEpisode,
  getEpisodes,
  getEpisodeById,
  getEpisodesByChurch,
  updateEpisode,
  deleteEpisode,
} from '@/services/episodeService';

import type { Episode } from '@/types/database';
import type { AnalysisResult } from '@/types';

const mockAnalysis: AnalysisResult = {
  keyMoments: [
    {
      title: 'Opening Prayer',
      timestamp: '00:00 - 02:00',
      reasoning: 'Emotional opening',
      hook: 'This prayer changed everything',
      estimatedContext: 'Pastor opens with heartfelt prayer',
    },
  ],
  spotifyTitles: ['Title 1', 'Title 2', 'Title 3'],
  spotifyDescriptionSnippet: 'A powerful sermon about faith.',
  spotifyDescriptionBody: 'In this sermon, Pastor...',
  spotifyCTA: 'What moment spoke to you?',
  spotifyPollQuestion: 'Which topic resonated most?',
  spotifyPollOptions: ['Faith', 'Hope', 'Love', 'Grace', 'Mercy'],
  biblicalReferences: ['John 3:16', 'Romans 8:28'],
  tags: ['faith', 'sermon', 'church'],
  marketingHooks: ['A sermon you cannot miss', 'Faith in action', 'Grace revealed'],
};

const sampleEpisode: Episode = {
  id: 'episode-uuid-1',
  church_id: 'church-uuid-1',
  title: 'Sunday Sermon',
  youtube_url: 'https://youtube.com/watch?v=abc123',
  sermon_date: '2026-01-05',
  status: 'completed',
  analysis_result: mockAnalysis,
  transcript: null,
  transcript_language: null,
  has_transcript: false,
  created_by: 'user-uuid-1',
  created_at: '2026-01-05T10:00:00Z',
  updated_at: '2026-01-05T10:00:00Z',
};

describe('episodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder.mockResult = { data: null, error: null };
  });

  describe('createEpisode', () => {
    it('inserts and returns the new episode', async () => {
      mockQueryBuilder.mockResult = { data: sampleEpisode, error: null };

      const result = await createEpisode({
        church_id: 'church-uuid-1',
        title: 'Sunday Sermon',
        youtube_url: 'https://youtube.com/watch?v=abc123',
        status: 'draft',
      });

      expect(mockFrom).toHaveBeenCalledWith('episodes');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(sampleEpisode);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Insert failed' } };

      await expect(
        createEpisode({ church_id: 'x', title: 'Test' }),
      ).rejects.toThrow('Failed to create episode');
    });
  });

  describe('getEpisodes', () => {
    it('returns a list of episodes', async () => {
      mockQueryBuilder.mockResult = { data: [sampleEpisode], error: null };

      const result = await getEpisodes();

      expect(mockFrom).toHaveBeenCalledWith('episodes');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual([sampleEpisode]);
    });

    it('returns empty array when data is null', async () => {
      mockQueryBuilder.mockResult = { data: null, error: null };

      const result = await getEpisodes();
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Fetch failed' } };

      await expect(getEpisodes()).rejects.toThrow('Failed to fetch episodes');
    });
  });

  describe('getEpisodeById', () => {
    it('returns a single episode', async () => {
      mockQueryBuilder.mockResult = { data: sampleEpisode, error: null };

      const result = await getEpisodeById('episode-uuid-1');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'episode-uuid-1');
      expect(result).toEqual(sampleEpisode);
    });

    it('returns null when not found', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Not found', code: 'PGRST116' } };

      const result = await getEpisodeById('nonexistent');
      expect(result).toBeNull();
    });

    it('throws on non-404 errors', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Server error', code: '500' } };

      await expect(getEpisodeById('id')).rejects.toThrow('Failed to fetch episode');
    });
  });

  describe('getEpisodesByChurch', () => {
    it('returns episodes filtered by church_id', async () => {
      mockQueryBuilder.mockResult = { data: [sampleEpisode], error: null };

      const result = await getEpisodesByChurch('church-uuid-1');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual([sampleEpisode]);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Fetch failed' } };

      await expect(getEpisodesByChurch('id')).rejects.toThrow('Failed to fetch episodes for church');
    });
  });

  describe('updateEpisode', () => {
    it('updates and returns the episode', async () => {
      const updated = { ...sampleEpisode, status: 'completed' as const };
      mockQueryBuilder.mockResult = { data: updated, error: null };

      const result = await updateEpisode('episode-uuid-1', { status: 'completed' });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'episode-uuid-1');
      expect(result).toEqual(updated);
    });

    it('updates analysis_result with JSONB data', async () => {
      const updated = { ...sampleEpisode, analysis_result: mockAnalysis };
      mockQueryBuilder.mockResult = { data: updated, error: null };

      const result = await updateEpisode('episode-uuid-1', { analysis_result: mockAnalysis });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ analysis_result: mockAnalysis });
      expect(result.analysis_result).toEqual(mockAnalysis);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Update failed' } };

      await expect(updateEpisode('id', { title: 'X' })).rejects.toThrow('Failed to update episode');
    });
  });

  describe('deleteEpisode', () => {
    it('deletes without error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: null };

      await expect(deleteEpisode('episode-uuid-1')).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith('episodes');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'episode-uuid-1');
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Delete failed' } };

      await expect(deleteEpisode('id')).rejects.toThrow('Failed to delete episode');
    });
  });

  describe('integration: create -> save analysis -> query -> verify', () => {
    it('creates an episode, saves analysis, and retrieves it', async () => {
      // Step 1: Create episode as draft
      const draftEpisode = { ...sampleEpisode, status: 'draft' as const, analysis_result: null };
      mockQueryBuilder.mockResult = { data: draftEpisode, error: null };
      const created = await createEpisode({
        church_id: 'church-uuid-1',
        title: 'Sunday Sermon',
        youtube_url: 'https://youtube.com/watch?v=abc123',
        status: 'draft',
      });
      expect(created.status).toBe('draft');

      // Step 2: Update with analysis result
      const completedEpisode = { ...sampleEpisode, status: 'completed' as const };
      mockQueryBuilder.mockResult = { data: completedEpisode, error: null };
      const updated = await updateEpisode(created.id, {
        status: 'completed',
        analysis_result: mockAnalysis,
      });
      expect(updated.status).toBe('completed');
      expect(updated.analysis_result).toEqual(mockAnalysis);

      // Step 3: Query and verify
      mockQueryBuilder.mockResult = { data: completedEpisode, error: null };
      const fetched = await getEpisodeById(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.analysis_result).toEqual(mockAnalysis);
      expect(fetched!.status).toBe('completed');
    });
  });
});
