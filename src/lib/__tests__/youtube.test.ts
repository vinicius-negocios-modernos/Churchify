import { describe, it, expect } from 'vitest';
import { extractVideoId, isYouTubeUrl } from '@/lib/youtube';

describe('extractVideoId', () => {
  it('extracts ID from standard YouTube URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('extracts ID from short youtu.be URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('extracts ID from embed URL', () => {
    expect(
      extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube URL', () => {
    expect(extractVideoId('https://example.com')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractVideoId('')).toBeNull();
  });

  it('extracts ID from URL with extra query params', () => {
    expect(
      extractVideoId(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLxyz',
      ),
    ).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from URL without www', () => {
    expect(
      extractVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('returns null for YouTube URL without video ID', () => {
    expect(extractVideoId('https://www.youtube.com/')).toBeNull();
  });

  it('returns null for YouTube channel URL', () => {
    expect(
      extractVideoId('https://www.youtube.com/channel/UC12345'),
    ).toBeNull();
  });

  it('handles ID with hyphens and underscores', () => {
    expect(
      extractVideoId('https://www.youtube.com/watch?v=a-B_c1D2e3F'),
    ).toBe('a-B_c1D2e3F');
  });
});

describe('isYouTubeUrl', () => {
  it('returns true for valid YouTube URLs', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      true,
    );
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('returns false for non-YouTube URLs', () => {
    expect(isYouTubeUrl('https://example.com')).toBe(false);
    expect(isYouTubeUrl('')).toBe(false);
  });
});
