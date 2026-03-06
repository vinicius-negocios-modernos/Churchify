-- ============================================
-- Migration: RLS Policies for all tables
-- Story: 1.8 -- RLS Policies & Storage Migration
-- ============================================
-- Note: RLS was already ENABLED on all tables in migrations 001 and 002.
-- This migration adds the actual access-control POLICIES.

-- ─── Profiles policies ────────────────────────────────────────────────────────
-- Already created in 001_create_profiles.sql:
--   "Users can view own profile" (SELECT)
--   "Users can update own profile" (UPDATE)
-- No additional policies needed for profiles.

-- ─── Churches policies ────────────────────────────────────────────────────────

-- Members of the church can view it
create policy "Church members can view church"
  on public.churches for select
  using (
    exists (
      select 1 from public.church_members
      where church_members.church_id = churches.id
        and church_members.user_id = auth.uid()
    )
  );

-- Only the creator can insert a church (they become owner via app logic)
create policy "Authenticated users can create churches"
  on public.churches for insert
  with check (auth.uid() = created_by);

-- Only admins/owners of the church can update it
create policy "Church admins can update church"
  on public.churches for update
  using (
    exists (
      select 1 from public.church_members
      where church_members.church_id = churches.id
        and church_members.user_id = auth.uid()
        and church_members.role in ('admin', 'owner')
    )
  );

-- ─── Episodes policies ───────────────────────────────────────────────────────

-- Church members can view episodes
create policy "Church members can view episodes"
  on public.episodes for select
  using (
    exists (
      select 1 from public.church_members
      where church_members.church_id = episodes.church_id
        and church_members.user_id = auth.uid()
    )
  );

-- Church members can create episodes
create policy "Church members can create episodes"
  on public.episodes for insert
  with check (
    exists (
      select 1 from public.church_members
      where church_members.church_id = episodes.church_id
        and church_members.user_id = auth.uid()
    )
  );

-- Church members can update episodes
create policy "Church members can update episodes"
  on public.episodes for update
  using (
    exists (
      select 1 from public.church_members
      where church_members.church_id = episodes.church_id
        and church_members.user_id = auth.uid()
    )
  );

-- Only admins/owners can delete episodes
create policy "Church admins can delete episodes"
  on public.episodes for delete
  using (
    exists (
      select 1 from public.church_members
      where church_members.church_id = episodes.church_id
        and church_members.user_id = auth.uid()
        and church_members.role in ('admin', 'owner')
    )
  );

-- ─── Church members policies ─────────────────────────────────────────────────

-- Users can see their own memberships
create policy "Users can view own memberships"
  on public.church_members for select
  using (auth.uid() = user_id);

-- Only admins/owners can add members to a church
create policy "Church admins can add members"
  on public.church_members for insert
  with check (
    exists (
      select 1 from public.church_members as cm
      where cm.church_id = church_members.church_id
        and cm.user_id = auth.uid()
        and cm.role in ('admin', 'owner')
    )
  );
