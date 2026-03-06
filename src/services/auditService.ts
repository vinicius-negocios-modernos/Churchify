import { supabase } from '@/lib/supabase';
import type { AuditLog } from '@/types/database';

const TABLE = 'audit_log';

export interface GetAuditLogOptions {
  limit?: number;
  offset?: number;
  entityType?: string;
}

export async function getAuditLog(
  churchId: string,
  options: GetAuditLogOptions = {},
): Promise<AuditLog[]> {
  const { limit = 50, offset = 0, entityType } = options;

  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch audit log: ${error.message}`);
  return (data ?? []) as AuditLog[];
}

export interface LogActionParams {
  churchId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logAction(params: LogActionParams): Promise<AuditLog> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      church_id: params.churchId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      details: params.details ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to log action: ${error.message}`);
  return data as AuditLog;
}
