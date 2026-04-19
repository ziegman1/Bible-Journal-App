-- HOLD retention: simple review states and next-review timing (hidden /scripture module).

ALTER TABLE scripture_item_memory
  ADD COLUMN hold_status TEXT CHECK (hold_status IS NULL OR hold_status IN ('fresh', 'strengthening', 'established')),
  ADD COLUMN hold_next_review_at TIMESTAMPTZ,
  ADD COLUMN hold_last_reviewed_at TIMESTAMPTZ,
  ADD COLUMN hold_review_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN hold_last_outcome TEXT CHECK (hold_last_outcome IS NULL OR hold_last_outcome IN ('easy', 'okay', 'hard'));

COMMENT ON COLUMN scripture_item_memory.hold_status IS 'NULL until GRIP completed; then Fresh | Strengthening | Established.';

CREATE INDEX idx_scripture_item_memory_hold_due
  ON scripture_item_memory (user_id, hold_next_review_at)
  WHERE grip_status = 'completed' AND hold_status IS NOT NULL;

-- Backfill verses that already finished GRIP before HOLD columns existed.
UPDATE scripture_item_memory
SET
  hold_status = 'fresh',
  hold_next_review_at = completed_at + interval '1 day',
  hold_review_count = 0
WHERE grip_status = 'completed'
  AND hold_status IS NULL;
