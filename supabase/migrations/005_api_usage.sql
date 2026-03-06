-- Migration: 005_api_usage
-- Story: 1.10 — Security Hardening: API Proxy & Key Protection
-- Purpose: Track API usage per user for rate limiting and analytics

CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient rate limiting queries (user + time range)
CREATE INDEX idx_api_usage_user_created ON api_usage (user_id, created_at DESC);

-- RLS: users can only read their own usage
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (Edge Functions) can insert usage records
-- No INSERT policy needed for regular users — only the Edge Function (service role) inserts
CREATE POLICY "Service role can insert usage"
  ON api_usage FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE api_usage IS 'Tracks per-user API usage for rate limiting and analytics';
