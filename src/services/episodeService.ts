import { supabase } from '@/lib/supabase';
import type { Episode, EpisodeInsert, EpisodeUpdate } from '@/types/database';

const TABLE = 'episodes';

export async function createEpisode(data: EpisodeInsert): Promise<Episode> {
  const { data: episode, error } = await supabase
    .from(TABLE)
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create episode: ${error.message}`);
  return episode as Episode;
}

export async function getEpisodes(): Promise<Episode[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch episodes: ${error.message}`);
  return (data ?? []) as Episode[];
}

export async function getEpisodeById(id: string): Promise<Episode | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch episode: ${error.message}`);
  }
  return data as Episode;
}

export async function getEpisodesByChurch(churchId: string): Promise<Episode[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch episodes for church: ${error.message}`);
  return (data ?? []) as Episode[];
}

export async function updateEpisode(id: string, data: EpisodeUpdate): Promise<Episode> {
  const { data: episode, error } = await supabase
    .from(TABLE)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update episode: ${error.message}`);
  return episode as Episode;
}

export async function deleteEpisode(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete episode: ${error.message}`);
}
