import { supabase } from '@/lib/supabase';

const BUCKET = 'episode-images';

/**
 * Upload a file to Supabase Storage.
 *
 * @param file - The File or Blob to upload
 * @param path - Storage path: `{churchId}/{episodeId}/{filename}`
 * @returns The storage path of the uploaded file
 */
export async function uploadFile(file: File | Blob, path: string): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return path;
}

/**
 * Get the public URL for a file in Storage.
 *
 * @param path - Storage path of the file
 * @returns Public URL string
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Storage.
 *
 * @param path - Storage path of the file to delete
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Upload an image and return its public URL.
 * Convenience wrapper combining upload + getPublicUrl.
 *
 * @param file - The image File or Blob
 * @param churchId - The church ID for path namespacing
 * @param episodeId - The episode ID for path namespacing
 * @param filename - The desired filename (e.g., 'thumbnail.png')
 * @returns Public URL of the uploaded image
 */
export async function uploadEpisodeImage(
  file: File | Blob,
  churchId: string,
  episodeId: string,
  filename: string,
): Promise<string> {
  const path = `${churchId}/${episodeId}/${filename}`;
  await uploadFile(file, path);
  return getPublicUrl(path);
}
