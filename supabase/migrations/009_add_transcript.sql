-- Add transcript fields to episodes table
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS transcript_language TEXT;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS has_transcript BOOLEAN DEFAULT false;

COMMENT ON COLUMN episodes.transcript IS 'Full transcript extracted from YouTube video captions';
COMMENT ON COLUMN episodes.transcript_language IS 'Language code of the transcript (e.g., pt, pt-BR, en)';
COMMENT ON COLUMN episodes.has_transcript IS 'Whether a transcript was successfully extracted';
