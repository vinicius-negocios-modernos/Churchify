const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&].*)?$/;

/**
 * Validates whether the given string is a valid YouTube URL.
 */
export function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url.trim());
}

/**
 * Extracts the 11-character video ID from a YouTube URL.
 * Returns null if the URL is invalid.
 */
export function extractYouTubeVideoId(url: string): string | null {
  const match = url.trim().match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}
