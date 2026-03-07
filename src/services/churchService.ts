// @planned — Infrastructure prepared for future UI integration (church management screens). Not currently used in app code.
import { supabase } from '@/lib/supabase';
import type { Church, ChurchInsert, ChurchUpdate } from '@/types/database';

const TABLE = 'churches';

export async function createChurch(data: ChurchInsert): Promise<Church> {
  const { data: church, error } = await supabase
    .from(TABLE)
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create church: ${error.message}`);
  return church as Church;
}

export async function getChurches(): Promise<Church[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch churches: ${error.message}`);
  return (data ?? []) as Church[];
}

export async function getChurchById(id: string): Promise<Church | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch church: ${error.message}`);
  }
  return data as Church;
}

export async function updateChurch(id: string, data: ChurchUpdate): Promise<Church> {
  const { data: church, error } = await supabase
    .from(TABLE)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update church: ${error.message}`);
  return church as Church;
}

export async function deleteChurch(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete church: ${error.message}`);
}
