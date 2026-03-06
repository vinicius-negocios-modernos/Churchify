import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockFunctionsInvoke } from '@/test/mocks/supabase';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase').then((m) => m.supabaseLibMock));

import { analyzeSermonContent, generateSermonImages } from '@/services/geminiService';
import type { SermonInput, AnalysisResult, GeneratedImages } from '@/types';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const mockInput: SermonInput = {
  youtubeUrl: 'https://youtube.com/watch?v=test123',
  preacherName: 'Pastor Test',
  title: 'Faith in Action',
};

const mockAnalysisResult: AnalysisResult = {
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

const mockImagesResult: GeneratedImages = {
  thumbnail16_9: 'data:image/png;base64,thumb_data',
  artwork1_1: 'data:image/png;base64,art_data',
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeSermonContent', () => {
    it('should call Edge Function with analyze action and return result', async () => {
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: mockAnalysisResult,
        error: null,
      });

      const result = await analyzeSermonContent(mockInput);

      expect(mockFunctionsInvoke).toHaveBeenCalledWith('generate-content', {
        body: {
          action: 'analyze',
          title: mockInput.title,
          preacherName: mockInput.preacherName,
          youtubeUrl: mockInput.youtubeUrl,
        },
      });
      expect(result).toEqual(mockAnalysisResult);
    });

    it('should throw error when Edge Function returns error', async () => {
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Rate limit exceeded' },
      });

      await expect(analyzeSermonContent(mockInput)).rejects.toThrow('Rate limit exceeded');
    });

    it('should throw generic error when Edge Function error has no message', async () => {
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: '' },
      });

      await expect(analyzeSermonContent(mockInput)).rejects.toThrow('Failed to call AI service');
    });
  });

  describe('generateSermonImages', () => {
    it('should call Edge Function with generateImages action and return result', async () => {
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: mockImagesResult,
        error: null,
      });

      const result = await generateSermonImages('base64data', 'image/png', 'Test Title', 'Pastor');

      expect(mockFunctionsInvoke).toHaveBeenCalledWith('generate-content', {
        body: {
          action: 'generateImages',
          imageBase64: 'base64data',
          mimeType: 'image/png',
          title: 'Test Title',
        },
      });
      expect(result).toEqual(mockImagesResult);
    });

    it('should throw error when Edge Function returns error', async () => {
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'AI service temporarily unavailable' },
      });

      await expect(
        generateSermonImages('base64', 'image/png', 'Title', 'Pastor'),
      ).rejects.toThrow('AI service temporarily unavailable');
    });
  });

  describe('rate limiting integration', () => {
    it('should propagate 429 rate limit error from Edge Function', async () => {
      const rateLimitMessage =
        'Limite de uso atingido. Voce pode fazer ate 50 chamadas por dia. Tente novamente amanha.';
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: rateLimitMessage },
      });

      await expect(analyzeSermonContent(mockInput)).rejects.toThrow(rateLimitMessage);
    });

    it('should propagate 429 for image generation too', async () => {
      const rateLimitMessage =
        'Limite de uso atingido. Voce pode fazer ate 50 chamadas por dia. Tente novamente amanha.';
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: rateLimitMessage },
      });

      await expect(
        generateSermonImages('base64', 'image/png', 'Title', 'Pastor'),
      ).rejects.toThrow(rateLimitMessage);
    });

    it('should succeed when under rate limit', async () => {
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: mockAnalysisResult,
        error: null,
      });

      const result = await analyzeSermonContent(mockInput);
      expect(result).toEqual(mockAnalysisResult);
    });

    it('should handle server error gracefully', async () => {
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Internal server error' },
      });

      await expect(analyzeSermonContent(mockInput)).rejects.toThrow('Internal server error');
    });

    it('should handle missing auth error', async () => {
      mockFunctionsInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Missing authorization header' },
      });

      await expect(analyzeSermonContent(mockInput)).rejects.toThrow(
        'Missing authorization header',
      );
    });
  });
});
