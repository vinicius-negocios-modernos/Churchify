/**
 * YouTube URL utilities — client-side validation.
 * Mirrors the extractVideoId logic in the Edge Function for pre-submission validation.
 */

/**
 * Extracts a YouTube video ID from various URL formats.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - URLs with extra query parameters
 *
 * @returns The 11-character video ID, or null if the URL is not a valid YouTube URL.
 */
export function extractVideoId(url: string): string | null {
  const pattern =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Checks whether a URL is a recognized YouTube video URL.
 */
export function isYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}
