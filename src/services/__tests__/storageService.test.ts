import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockStorageFrom,
  mockStorageUpload,
  mockStorageGetPublicUrl,
  mockStorageRemove,
} from '@/test/mocks/supabase';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase').then((m) => m.supabaseLibMock));

import {
  uploadFile,
  getPublicUrl,
  deleteFile,
  uploadEpisodeImage,
} from '@/services/storageService';

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageUpload.mockResolvedValue({ data: { path: 'test/path' }, error: null });
    mockStorageGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/test/path' },
    });
    mockStorageRemove.mockResolvedValue({ data: [], error: null });
  });

  describe('uploadFile', () => {
    it('uploads a file and returns the path', async () => {
      const file = new Blob(['test'], { type: 'image/png' });
      const path = 'church-1/episode-1/thumbnail.png';

      const result = await uploadFile(file as File, path);

      expect(mockStorageFrom).toHaveBeenCalledWith('episode-images');
      expect(mockStorageUpload).toHaveBeenCalledWith(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      expect(result).toBe(path);
    });

    it('throws on upload error', async () => {
      mockStorageUpload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      const file = new Blob(['test'], { type: 'image/png' });

      await expect(uploadFile(file as File, 'bad/path')).rejects.toThrow(
        'Failed to upload file: Upload failed',
      );
    });
  });

  describe('getPublicUrl', () => {
    it('returns the public URL for a path', () => {
      const url = getPublicUrl('church-1/episode-1/thumbnail.png');

      expect(mockStorageFrom).toHaveBeenCalledWith('episode-images');
      expect(mockStorageGetPublicUrl).toHaveBeenCalledWith('church-1/episode-1/thumbnail.png');
      expect(url).toBe('https://storage.example.com/test/path');
    });
  });

  describe('deleteFile', () => {
    it('deletes a file by path', async () => {
      await deleteFile('church-1/episode-1/thumbnail.png');

      expect(mockStorageFrom).toHaveBeenCalledWith('episode-images');
      expect(mockStorageRemove).toHaveBeenCalledWith(['church-1/episode-1/thumbnail.png']);
    });

    it('throws on delete error', async () => {
      mockStorageRemove.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });

      await expect(deleteFile('bad/path')).rejects.toThrow(
        'Failed to delete file: Delete failed',
      );
    });
  });

  describe('uploadEpisodeImage', () => {
    it('uploads to the correct path and returns public URL', async () => {
      const expectedPath = 'church-uuid/episode-uuid/thumbnail.png';
      mockStorageGetPublicUrl.mockReturnValue({
        data: { publicUrl: `https://storage.example.com/${expectedPath}` },
      });

      const file = new Blob(['image-data'], { type: 'image/png' });
      const url = await uploadEpisodeImage(
        file as File,
        'church-uuid',
        'episode-uuid',
        'thumbnail.png',
      );

      expect(mockStorageUpload).toHaveBeenCalledWith(expectedPath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      expect(url).toBe(`https://storage.example.com/${expectedPath}`);
    });
  });
});
