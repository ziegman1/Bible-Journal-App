-- Memorization engine v2: stage model, JSON progress, review ladder + default interval index.

ALTER TABLE scripture_item_memory
  ADD COLUMN memorize_stage TEXT,
  ADD COLUMN memorize_progress JSONB,
  ADD COLUMN review_stage TEXT,
  ADD COLUMN review_interval_index INTEGER NOT NULL DEFAULT 0;

UPDATE scripture_item_memory
SET memorize_stage = CASE
  WHEN memorize_flow_step = 'completed' THEN 'completed'
  WHEN memorize_flow_step = 'full_recall' THEN 'stage_5'
  WHEN memorize_flow_step = 'supported_recall' THEN 'stage_4'
  WHEN memorize_flow_step IN ('phrases', 'preview') THEN 'context'
  ELSE 'context'
END;

UPDATE scripture_item_memory
SET review_stage = 'stage_4'
WHERE memorize_stage = 'completed';

ALTER TABLE scripture_item_memory
  DROP CONSTRAINT IF EXISTS scripture_item_memory_memorize_flow_step_check;

ALTER TABLE scripture_item_memory
  DROP COLUMN memorize_flow_step;

ALTER TABLE scripture_item_memory
  ALTER COLUMN memorize_stage SET DEFAULT 'context',
  ALTER COLUMN memorize_stage SET NOT NULL;

ALTER TABLE scripture_item_memory
  ADD CONSTRAINT scripture_item_memory_memorize_stage_check
  CHECK (
    memorize_stage IN ('context', 'stage_2', 'stage_3', 'stage_4', 'stage_5', 'completed')
  );

ALTER TABLE scripture_item_memory
  ADD CONSTRAINT scripture_item_memory_review_stage_check
  CHECK (review_stage IS NULL OR review_stage IN ('stage_2', 'stage_3', 'stage_4', 'stage_5'));

COMMENT ON COLUMN scripture_item_memory.memorize_stage IS 'Memorization ladder: context → stage_2…stage_5 → completed.';
COMMENT ON COLUMN scripture_item_memory.memorize_progress IS 'Opaque JSON for sub-step state (Stage 2 ladder, Stage 3 rounds, etc.).';
COMMENT ON COLUMN scripture_item_memory.review_stage IS 'Next review exercise stage (starts at stage_4); null if memorization not complete.';
COMMENT ON COLUMN scripture_item_memory.review_interval_index IS 'Index into default interval days [1,3,7,14,30] after each completed review cycle.';
