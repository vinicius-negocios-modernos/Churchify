import type { AnalysisResult } from '@/types';

export interface Church {
  id: string;
  name: string;
  plan: string;
  logo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ChurchInsert = Pick<Church, 'name'> &
  Partial<Pick<Church, 'plan' | 'logo_url' | 'created_by'>>;

export type ChurchUpdate = Partial<Pick<Church, 'name' | 'plan' | 'logo_url'>>;

export type EpisodeStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface Episode {
  id: string;
  church_id: string;
  title: string;
  youtube_url: string | null;
  sermon_date: string | null;
  status: EpisodeStatus;
  analysis_result: AnalysisResult | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EpisodeInsert = Pick<Episode, 'church_id' | 'title'> &
  Partial<
    Pick<Episode, 'youtube_url' | 'sermon_date' | 'status' | 'analysis_result' | 'created_by'>
  >;

export type EpisodeUpdate = Partial<
  Pick<Episode, 'title' | 'youtube_url' | 'sermon_date' | 'status' | 'analysis_result'>
>;

export interface ChurchMember {
  church_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}
