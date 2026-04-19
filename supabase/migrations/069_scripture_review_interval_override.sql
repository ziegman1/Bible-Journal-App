-- Optional manual spacing (days) for next review after a completed cycle. Null = use default index-based cadence.

ALTER TABLE scripture_item_memory
  ADD COLUMN review_interval_override_days INTEGER;

ALTER TABLE scripture_item_memory
  ADD CONSTRAINT scripture_item_memory_review_interval_override_days_check
  CHECK (
    review_interval_override_days IS NULL
    OR review_interval_override_days IN (1, 3, 5, 7, 14, 30)
  );

COMMENT ON COLUMN scripture_item_memory.review_interval_override_days IS 'If set, days until next review after a cycle completes; null uses default review_interval_index cadence.';
