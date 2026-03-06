import { supabase } from '@/lib/supabase';
import type { ChurchMember, ChurchRole } from '@/types/database';

const TABLE = 'church_members';

export interface MemberWithProfile extends ChurchMember {
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface MemberChurch extends ChurchMember {
  churches: {
    id: string;
    name: string;
    plan: string;
    logo_url: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export async function getMembers(churchId: string): Promise<MemberWithProfile[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, profiles(display_name, avatar_url)')
    .eq('church_id', churchId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch members: ${error.message}`);
  return (data ?? []) as MemberWithProfile[];
}

export async function getMemberRole(
  churchId: string,
  userId: string,
): Promise<ChurchRole | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('role')
    .eq('church_id', churchId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch member role: ${error.message}`);
  }
  return data?.role as ChurchRole ?? null;
}

export async function getUserChurches(userId: string): Promise<MemberChurch[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, churches(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch user churches: ${error.message}`);
  return (data ?? []) as MemberChurch[];
}

export async function inviteMember(
  churchId: string,
  email: string,
  role: ChurchRole,
  invitedBy: string,
): Promise<ChurchMember> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      church_id: churchId,
      user_id: invitedBy, // placeholder until invite is accepted
      role,
      status: 'invited',
      invited_email: email,
      invited_by: invitedBy,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to invite member: ${error.message}`);
  return data as ChurchMember;
}

export async function acceptInvite(
  churchId: string,
  userId: string,
): Promise<ChurchMember> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'active', user_id: userId })
    .eq('church_id', churchId)
    .eq('status', 'invited')
    .select()
    .single();

  if (error) throw new Error(`Failed to accept invite: ${error.message}`);
  return data as ChurchMember;
}

export async function removeMember(
  churchId: string,
  userId: string,
): Promise<ChurchMember> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'removed' })
    .eq('church_id', churchId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to remove member: ${error.message}`);
  return data as ChurchMember;
}

export async function changeRole(
  churchId: string,
  userId: string,
  newRole: ChurchRole,
): Promise<ChurchMember> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ role: newRole })
    .eq('church_id', churchId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .select()
    .single();

  if (error) throw new Error(`Failed to change member role: ${error.message}`);
  return data as ChurchMember;
}

export async function cancelInvite(
  churchId: string,
  email: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('church_id', churchId)
    .eq('invited_email', email)
    .eq('status', 'invited');

  if (error) throw new Error(`Failed to cancel invite: ${error.message}`);
}
