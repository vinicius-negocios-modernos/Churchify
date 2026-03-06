import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockQueryBuilder,
  mockFrom,
} from '@/test/mocks/supabase';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase').then((m) => m.supabaseLibMock));

import {
  createChurch,
  getChurches,
  getChurchById,
  updateChurch,
  deleteChurch,
} from '@/services/churchService';

import type { Church } from '@/types/database';

const sampleChurch: Church = {
  id: 'church-uuid-1',
  name: 'Grace Church',
  plan: 'free',
  logo_url: null,
  created_by: 'user-uuid-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('churchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder.mockResult = { data: null, error: null };
  });

  describe('createChurch', () => {
    it('inserts and returns the new church', async () => {
      mockQueryBuilder.mockResult = { data: sampleChurch, error: null };

      const result = await createChurch({ name: 'Grace Church', created_by: 'user-uuid-1' });

      expect(mockFrom).toHaveBeenCalledWith('churches');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        name: 'Grace Church',
        created_by: 'user-uuid-1',
      });
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(sampleChurch);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Insert failed' } };

      await expect(createChurch({ name: 'Test' })).rejects.toThrow('Failed to create church: Insert failed');
    });
  });

  describe('getChurches', () => {
    it('returns a list of churches', async () => {
      mockQueryBuilder.mockResult = { data: [sampleChurch], error: null };

      const result = await getChurches();

      expect(mockFrom).toHaveBeenCalledWith('churches');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual([sampleChurch]);
    });

    it('returns empty array when data is null', async () => {
      mockQueryBuilder.mockResult = { data: null, error: null };

      const result = await getChurches();
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Fetch failed' } };

      await expect(getChurches()).rejects.toThrow('Failed to fetch churches');
    });
  });

  describe('getChurchById', () => {
    it('returns a single church', async () => {
      mockQueryBuilder.mockResult = { data: sampleChurch, error: null };

      const result = await getChurchById('church-uuid-1');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'church-uuid-1');
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(sampleChurch);
    });

    it('returns null when not found', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Not found', code: 'PGRST116' } };

      const result = await getChurchById('nonexistent');
      expect(result).toBeNull();
    });

    it('throws on non-404 errors', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Server error', code: '500' } };

      await expect(getChurchById('id')).rejects.toThrow('Failed to fetch church');
    });
  });

  describe('updateChurch', () => {
    it('updates and returns the church', async () => {
      const updated = { ...sampleChurch, name: 'New Name' };
      mockQueryBuilder.mockResult = { data: updated, error: null };

      const result = await updateChurch('church-uuid-1', { name: 'New Name' });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ name: 'New Name' });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'church-uuid-1');
      expect(result).toEqual(updated);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Update failed' } };

      await expect(updateChurch('id', { name: 'X' })).rejects.toThrow('Failed to update church');
    });
  });

  describe('deleteChurch', () => {
    it('deletes without error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: null };

      await expect(deleteChurch('church-uuid-1')).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith('churches');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'church-uuid-1');
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Delete failed' } };

      await expect(deleteChurch('id')).rejects.toThrow('Failed to delete church');
    });
  });
});
