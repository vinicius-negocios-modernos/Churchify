import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockQueryBuilder,
  mockFrom,
} from '@/test/mocks/supabase';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase').then((m) => m.supabaseLibMock));

import { getAuditLog, logAction } from '@/services/auditService';

import type { AuditLog } from '@/types/database';

const sampleAuditEntry: AuditLog = {
  id: 'audit-uuid-1',
  church_id: 'church-uuid-1',
  user_id: 'user-uuid-1',
  action: 'member.invited',
  entity_type: 'member',
  entity_id: 'member-uuid-1',
  details: { email: 'new@church.com' },
  created_at: '2026-03-06T10:00:00Z',
};

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder.mockResult = { data: null, error: null };
  });

  describe('getAuditLog', () => {
    it('returns entries for church, ordered by created_at DESC', async () => {
      mockQueryBuilder.mockResult = { data: [sampleAuditEntry], error: null };

      const result = await getAuditLog('church-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('audit_log');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 49);
      expect(result).toEqual([sampleAuditEntry]);
    });

    it('respects limit option', async () => {
      mockQueryBuilder.mockResult = { data: [sampleAuditEntry], error: null };

      await getAuditLog('church-uuid-1', { limit: 10 });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9);
    });

    it('filters by entityType', async () => {
      mockQueryBuilder.mockResult = { data: [sampleAuditEntry], error: null };

      await getAuditLog('church-uuid-1', { entityType: 'member' });

      // eq is called for church_id and entity_type
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('entity_type', 'member');
    });

    it('returns empty array when data is null', async () => {
      mockQueryBuilder.mockResult = { data: null, error: null };

      const result = await getAuditLog('church-uuid-1');
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Query failed' } };

      await expect(getAuditLog('church-uuid-1')).rejects.toThrow(
        'Failed to fetch audit log: Query failed',
      );
    });
  });

  describe('logAction', () => {
    it('inserts audit entry correctly', async () => {
      mockQueryBuilder.mockResult = { data: sampleAuditEntry, error: null };

      const result = await logAction({
        churchId: 'church-uuid-1',
        userId: 'user-uuid-1',
        action: 'member.invited',
        entityType: 'member',
        entityId: 'member-uuid-1',
        details: { email: 'new@church.com' },
      });

      expect(mockFrom).toHaveBeenCalledWith('audit_log');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        church_id: 'church-uuid-1',
        user_id: 'user-uuid-1',
        action: 'member.invited',
        entity_type: 'member',
        entity_id: 'member-uuid-1',
        details: { email: 'new@church.com' },
      });
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(sampleAuditEntry);
    });

    it('uses defaults for optional fields', async () => {
      mockQueryBuilder.mockResult = { data: sampleAuditEntry, error: null };

      await logAction({
        churchId: 'church-uuid-1',
        userId: 'user-uuid-1',
        action: 'church.updated',
        entityType: 'church',
      });

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        church_id: 'church-uuid-1',
        user_id: 'user-uuid-1',
        action: 'church.updated',
        entity_type: 'church',
        entity_id: null,
        details: {},
      });
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Insert failed' } };

      await expect(
        logAction({
          churchId: 'church-uuid-1',
          userId: 'user-uuid-1',
          action: 'test',
          entityType: 'test',
        }),
      ).rejects.toThrow('Failed to log action: Insert failed');
    });
  });
});
