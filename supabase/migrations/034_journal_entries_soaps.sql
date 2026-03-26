-- SOAPS journaling: verbatim Scripture + share (second S)
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS scripture_text TEXT,
  ADD COLUMN IF NOT EXISTS soaps_share TEXT;

COMMENT ON COLUMN journal_entries.scripture_text IS 'User-transcribed Scripture (SOAPS: S)';
COMMENT ON COLUMN journal_entries.soaps_share IS 'SOAPS: who/how to share with others';
