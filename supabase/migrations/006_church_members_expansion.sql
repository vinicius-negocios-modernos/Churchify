-- Migration 006: Expand church_members with role enum, status, and new columns
-- Story 1.14 — Multi-tenancy & Church Isolation (Tasks 1 & 7)

-- 1. Create role enum type
CREATE TYPE church_role AS ENUM ('admin', 'editor', 'viewer');

-- 2. Add new columns to church_members
ALTER TABLE church_members
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS invited_email TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'removed')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Convert role column from TEXT to enum
-- First map existing values
UPDATE church_members SET role = 'viewer' WHERE role = 'member';
UPDATE church_members SET role = 'admin' WHERE role = 'owner';

-- Drop policies that reference the role column (will be recreated in migration 008)
DROP POLICY IF EXISTS "Church admins can update church" ON public.churches;
DROP POLICY IF EXISTS "Church admins can delete episodes" ON public.episodes;
DROP POLICY IF EXISTS "Church admins can add members" ON public.church_members;

-- Drop existing default before type change
ALTER TABLE church_members ALTER COLUMN role DROP DEFAULT;

-- Change column type
ALTER TABLE church_members
  ALTER COLUMN role TYPE church_role USING role::church_role;

-- Set new default with enum type
ALTER TABLE church_members ALTER COLUMN role SET DEFAULT 'viewer'::church_role;

-- 4. Add unique constraint on id for FK references
ALTER TABLE church_members
  ADD CONSTRAINT church_members_id_unique UNIQUE (id);

-- 5. Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_church_members_user_id ON church_members(user_id);
CREATE INDEX IF NOT EXISTS idx_church_members_status ON church_members(status);
