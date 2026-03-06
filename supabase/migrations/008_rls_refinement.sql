-- Migration 008: Refine RLS policies with role-based granularity using church_role enum
-- Story 1.14 — Multi-tenancy & Church Isolation (Task 4)
--
-- Context: Migration 006 already dropped 3 policies that referenced old TEXT role column:
--   - "Church admins can update church" on churches
--   - "Church admins can delete episodes" on episodes
--   - "Church admins can add members" on church_members
--
-- This migration drops the remaining policies from 003 that lack role granularity
-- and status checks, then recreates ALL policies with proper role-based access.

-- ═══════════════════════════════════════════════════════════════════════════════
-- DROP remaining policies from migration 003 that need refinement
-- ═══════════════════════════════════════════════════════════════════════════════

-- Churches
DROP POLICY IF EXISTS "Church members can view church" ON public.churches;
DROP POLICY IF EXISTS "Authenticated users can create churches" ON public.churches;

-- Episodes
DROP POLICY IF EXISTS "Church members can view episodes" ON public.episodes;
DROP POLICY IF EXISTS "Church members can create episodes" ON public.episodes;
DROP POLICY IF EXISTS "Church members can update episodes" ON public.episodes;

-- Church members
DROP POLICY IF EXISTS "Users can view own memberships" ON public.church_members;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CHURCHES policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- All active members (viewer/editor/admin) can view their church
CREATE POLICY "Active members can view church"
  ON public.churches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = churches.id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- Any authenticated user can create a church (they become admin via app logic)
CREATE POLICY "Authenticated users can create churches"
  ON public.churches FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Admin only: update church details
CREATE POLICY "Admins can update church"
  ON public.churches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = churches.id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- EPISODES policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- All active members can view episodes
CREATE POLICY "Active members can view episodes"
  ON public.episodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = episodes.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- Editor + admin can create episodes
CREATE POLICY "Editors and admins can create episodes"
  ON public.episodes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = episodes.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('editor', 'admin')
    )
  );

-- Editor + admin can update episodes
CREATE POLICY "Editors and admins can update episodes"
  ON public.episodes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = episodes.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role IN ('editor', 'admin')
    )
  );

-- Admin only: delete episodes
CREATE POLICY "Admins can delete episodes"
  ON public.episodes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = episodes.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- CHURCH_MEMBERS policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- All active members can view members of their church
CREATE POLICY "Active members can view church members"
  ON public.church_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = church_members.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- Admin only: invite/add members
CREATE POLICY "Admins can add members"
  ON public.church_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = church_members.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role = 'admin'
    )
  );

-- Admin only: update member role/status
CREATE POLICY "Admins can update members"
  ON public.church_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = church_members.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role = 'admin'
    )
  );

-- Admin only: remove members (hard delete invited records)
CREATE POLICY "Admins can delete members"
  ON public.church_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.church_members cm
      WHERE cm.church_id = church_members.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role = 'admin'
    )
  );
