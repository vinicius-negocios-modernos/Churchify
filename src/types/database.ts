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
  transcript: string | null;
  transcript_language: string | null;
  has_transcript: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EpisodeInsert = Pick<Episode, 'church_id' | 'title'> &
  Partial<
    Pick<
      Episode,
      | 'youtube_url'
      | 'sermon_date'
      | 'status'
      | 'analysis_result'
      | 'created_by'
      | 'transcript'
      | 'transcript_language'
      | 'has_transcript'
    >
  >;

export type EpisodeUpdate = Partial<
  Pick<
    Episode,
    | 'title'
    | 'youtube_url'
    | 'sermon_date'
    | 'status'
    | 'analysis_result'
    | 'transcript'
    | 'transcript_language'
    | 'has_transcript'
  >
>;

export type ChurchRole = 'admin' | 'editor' | 'viewer';

export type MemberStatus = 'invited' | 'active' | 'removed';

export interface ChurchMember {
  id: string;
  church_id: string;
  user_id: string;
  role: ChurchRole;
  joined_at: string;
  invited_by: string | null;
  invited_email: string | null;
  status: MemberStatus;
  updated_at: string;
}

export type ChurchMemberInsert = Pick<ChurchMember, 'church_id' | 'user_id'> &
  Partial<Pick<ChurchMember, 'role' | 'invited_by' | 'invited_email' | 'status'>>;

export type ChurchMemberUpdate = Partial<Pick<ChurchMember, 'role' | 'status'>>;

export interface AuditLog {
  id: string;
  church_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
