import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockQueryBuilder,
  mockFrom,
} from '@/test/mocks/supabase';

vi.mock('@/lib/supabase', () => import('@/test/mocks/supabase').then((m) => m.supabaseLibMock));

import {
  getMembers,
  getMemberRole,
  getUserChurches,
  inviteMember,
  acceptInvite,
  removeMember,
  changeRole,
  cancelInvite,
} from '@/services/memberService';

import type { ChurchMember } from '@/types/database';
import type { MemberWithProfile, MemberChurch } from '@/services/memberService';

const sampleMember: ChurchMember = {
  id: 'member-uuid-1',
  church_id: 'church-uuid-1',
  user_id: 'user-uuid-1',
  role: 'admin',
  joined_at: '2026-01-01T00:00:00Z',
  invited_by: null,
  invited_email: null,
  status: 'active',
  updated_at: '2026-01-01T00:00:00Z',
};

const sampleMemberWithProfile: MemberWithProfile = {
  ...sampleMember,
  profiles: {
    display_name: 'Test User',
    avatar_url: 'https://example.com/photo.jpg',
  },
};

const sampleMemberChurch: MemberChurch = {
  ...sampleMember,
  churches: {
    id: 'church-uuid-1',
    name: 'Grace Church',
    plan: 'free',
    logo_url: null,
    created_by: 'user-uuid-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
};

describe('memberService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder.mockResult = { data: null, error: null };
  });

  describe('getMembers', () => {
    it('returns only active members for a church', async () => {
      mockQueryBuilder.mockResult = { data: [sampleMemberWithProfile], error: null };

      const result = await getMembers('church-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('church_members');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, profiles(display_name, avatar_url)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('joined_at', { ascending: true });
      expect(result).toEqual([sampleMemberWithProfile]);
    });

    it('returns empty array when data is null', async () => {
      mockQueryBuilder.mockResult = { data: null, error: null };

      const result = await getMembers('church-uuid-1');
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Fetch failed' } };

      await expect(getMembers('church-uuid-1')).rejects.toThrow('Failed to fetch members: Fetch failed');
    });
  });

  describe('getMemberRole', () => {
    it('returns correct role', async () => {
      mockQueryBuilder.mockResult = { data: { role: 'editor' }, error: null };

      const result = await getMemberRole('church-uuid-1', 'user-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('church_members');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('role');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toBe('editor');
    });

    it('returns null for non-member (PGRST116)', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Not found', code: 'PGRST116' } };

      const result = await getMemberRole('church-uuid-1', 'nonexistent');
      expect(result).toBeNull();
    });

    it('throws on non-404 errors', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Server error', code: '500' } };

      await expect(getMemberRole('church-uuid-1', 'user-uuid-1')).rejects.toThrow(
        'Failed to fetch member role: Server error',
      );
    });
  });

  describe('getUserChurches', () => {
    it('returns churches where user is active', async () => {
      mockQueryBuilder.mockResult = { data: [sampleMemberChurch], error: null };

      const result = await getUserChurches('user-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('church_members');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*, churches(*)');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('joined_at', { ascending: false });
      expect(result).toEqual([sampleMemberChurch]);
    });

    it('returns empty array when data is null', async () => {
      mockQueryBuilder.mockResult = { data: null, error: null };

      const result = await getUserChurches('user-uuid-1');
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Fetch failed' } };

      await expect(getUserChurches('user-uuid-1')).rejects.toThrow(
        'Failed to fetch user churches: Fetch failed',
      );
    });
  });

  describe('inviteMember', () => {
    it('creates record with status=invited', async () => {
      const invitedMember: ChurchMember = {
        ...sampleMember,
        status: 'invited',
        invited_email: 'new@church.com',
        invited_by: 'user-uuid-1',
      };
      mockQueryBuilder.mockResult = { data: invitedMember, error: null };

      const result = await inviteMember('church-uuid-1', 'new@church.com', 'editor', 'user-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('church_members');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        church_id: 'church-uuid-1',
        user_id: 'user-uuid-1',
        role: 'editor',
        status: 'invited',
        invited_email: 'new@church.com',
        invited_by: 'user-uuid-1',
      });
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(invitedMember);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Insert failed' } };

      await expect(inviteMember('church-uuid-1', 'x@y.com', 'viewer', 'user-uuid-1')).rejects.toThrow(
        'Failed to invite member: Insert failed',
      );
    });
  });

  describe('acceptInvite', () => {
    it('updates status to active', async () => {
      const activeMember = { ...sampleMember, status: 'active' as const };
      mockQueryBuilder.mockResult = { data: activeMember, error: null };

      const result = await acceptInvite('church-uuid-1', 'user-uuid-2');

      expect(mockFrom).toHaveBeenCalledWith('church_members');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'active', user_id: 'user-uuid-2' });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'invited');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(activeMember);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Accept failed' } };

      await expect(acceptInvite('church-uuid-1', 'user-uuid-2')).rejects.toThrow(
        'Failed to accept invite: Accept failed',
      );
    });
  });

  describe('removeMember', () => {
    it('updates status to removed', async () => {
      const removedMember = { ...sampleMember, status: 'removed' as const };
      mockQueryBuilder.mockResult = { data: removedMember, error: null };

      const result = await removeMember('church-uuid-1', 'user-uuid-1');

      expect(mockFrom).toHaveBeenCalledWith('church_members');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'removed' });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-uuid-1');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(removedMember);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Remove failed' } };

      await expect(removeMember('church-uuid-1', 'user-uuid-1')).rejects.toThrow(
        'Failed to remove member: Remove failed',
      );
    });
  });

  describe('changeRole', () => {
    it('updates role correctly', async () => {
      const updatedMember = { ...sampleMember, role: 'viewer' as const };
      mockQueryBuilder.mockResult = { data: updatedMember, error: null };

      const result = await changeRole('church-uuid-1', 'user-uuid-1', 'viewer');

      expect(mockFrom).toHaveBeenCalledWith('church_members');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ role: 'viewer' });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(updatedMember);
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Change failed' } };

      await expect(changeRole('church-uuid-1', 'user-uuid-1', 'editor')).rejects.toThrow(
        'Failed to change member role: Change failed',
      );
    });
  });

  describe('cancelInvite', () => {
    it('deletes the record', async () => {
      mockQueryBuilder.mockResult = { data: null, error: null };

      await expect(cancelInvite('church-uuid-1', 'invited@church.com')).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith('church_members');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('church_id', 'church-uuid-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('invited_email', 'invited@church.com');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'invited');
    });

    it('throws on error', async () => {
      mockQueryBuilder.mockResult = { data: null, error: { message: 'Cancel failed' } };

      await expect(cancelInvite('church-uuid-1', 'x@y.com')).rejects.toThrow(
        'Failed to cancel invite: Cancel failed',
      );
    });
  });
});
