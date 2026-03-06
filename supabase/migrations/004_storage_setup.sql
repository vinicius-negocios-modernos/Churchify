-- ============================================
-- Migration: Storage bucket & policies for episode images
-- Story: 1.8 -- RLS Policies & Storage Migration
-- ============================================

-- Create the episode-images bucket (public URLs, RLS-controlled uploads)
insert into storage.buckets (id, name, public)
values ('episode-images', 'episode-images', true)
on conflict (id) do nothing;

-- ─── Storage policies ─────────────────────────────────────────────────────────

-- Authenticated church members can upload images
-- Path convention: {church_id}/{episode_id}/{filename}
create policy "Church members can upload episode images"
  on storage.objects for insert
  with check (
    bucket_id = 'episode-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.church_members
      where church_members.church_id = (storage.foldername(name))[1]::uuid
        and church_members.user_id = auth.uid()
    )
  );

-- Authenticated church members can view/download images
create policy "Church members can view episode images"
  on storage.objects for select
  using (
    bucket_id = 'episode-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.church_members
      where church_members.church_id = (storage.foldername(name))[1]::uuid
        and church_members.user_id = auth.uid()
    )
  );

-- Authenticated church members can delete their church's images
create policy "Church members can delete episode images"
  on storage.objects for delete
  using (
    bucket_id = 'episode-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.church_members
      where church_members.church_id = (storage.foldername(name))[1]::uuid
        and church_members.user_id = auth.uid()
    )
  );
