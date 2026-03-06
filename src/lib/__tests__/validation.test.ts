import { isValidYouTubeUrl, extractYouTubeVideoId } from '@/lib/validation';

describe('isValidYouTubeUrl', () => {
  const validUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ&t=120',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
  ];

  it.each(validUrls)('accepts valid URL: %s', (url) => {
    expect(isValidYouTubeUrl(url)).toBe(true);
  });

  const invalidUrls = [
    '',
    'not-a-url',
    'https://vimeo.com/123456',
    'https://www.youtube.com/',
    'https://www.youtube.com/channel/UCxyz',
    'https://www.youtube.com/watch',
    'https://www.youtube.com/watch?v=short',
    'ftp://youtube.com/watch?v=dQw4w9WgXcQ',
  ];

  it.each(invalidUrls)('rejects invalid URL: %s', (url) => {
    expect(isValidYouTubeUrl(url)).toBe(false);
  });

  it('trims whitespace before validation', () => {
    expect(isValidYouTubeUrl('  https://youtu.be/dQw4w9WgXcQ  ')).toBe(true);
  });
});

describe('extractYouTubeVideoId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from short URL', () => {
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from shorts URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid URL', () => {
    expect(extractYouTubeVideoId('https://vimeo.com/123456')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractYouTubeVideoId('')).toBeNull();
  });
});
