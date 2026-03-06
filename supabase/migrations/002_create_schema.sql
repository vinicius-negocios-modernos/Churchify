-- ============================================
-- Migration: Create churches, episodes, church_members tables
-- Story: 1.7 -- Database Schema & Core Persistence
-- ============================================

-- ─── Churches table ─────────────────────────────────────────────────────────

create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'free',
  logo_url text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS (policies in Story 1.8)
alter table public.churches enable row level security;

-- Index on created_by for user queries
create index idx_churches_created_by on public.churches (created_by);

-- ─── Episodes table ─────────────────────────────────────────────────────────

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches on delete cascade not null,
  title text not null,
  youtube_url text,
  sermon_date date,
  status text default 'draft' not null,
  analysis_result jsonb,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS (policies in Story 1.8)
alter table public.episodes enable row level security;

-- CHECK constraint: status enum
alter table public.episodes
  add constraint chk_episodes_status
  check (status in ('draft', 'processing', 'completed', 'failed'));

-- GIN index on analysis_result for JSONB queries
create index idx_episodes_analysis_result on public.episodes using gin (analysis_result);

-- Indexes on foreign keys and frequently queried columns
create index idx_episodes_church_id on public.episodes (church_id);
create index idx_episodes_created_by on public.episodes (created_by);
create index idx_episodes_status on public.episodes (status);

-- ─── Church members table ───────────────────────────────────────────────────

create table if not exists public.church_members (
  church_id uuid references public.churches on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' not null,
  joined_at timestamptz default now() not null,
  primary key (church_id, user_id)
);

-- Enable RLS (policies in Story 1.8)
alter table public.church_members enable row level security;

-- ─── Updated_at triggers ────────────────────────────────────────────────────
-- Reuses handle_updated_at() function from 001_create_profiles.sql

create trigger on_church_updated
  before update on public.churches
  for each row execute function public.handle_updated_at();

create trigger on_episode_updated
  before update on public.episodes
  for each row execute function public.handle_updated_at();
