-- Sub-step state for review exercises (Stage 2 ladder, Stage 3 phrase rounds) while memorize_progress stays for initial learning.

ALTER TABLE scripture_item_memory
  ADD COLUMN IF NOT EXISTS review_progress JSONB;

COMMENT ON COLUMN scripture_item_memory.review_progress IS 'Review-session sub-steps (same shape as memorize_progress v1 keys: stage2, stage3, …).';
