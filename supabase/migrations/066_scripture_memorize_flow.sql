-- Structured memorization workflow (replaces GRIP step machine in the app; grip_status=completed still gates HOLD).

ALTER TABLE scripture_item_memory
  ADD COLUMN memorize_flow_step TEXT,
  ADD COLUMN memorize_paraphrase TEXT,
  ADD COLUMN memorize_meaning TEXT,
  ADD COLUMN phrase_segments JSONB,
  ADD COLUMN supported_recall_completed_at TIMESTAMPTZ,
  ADD COLUMN full_recall_completed_at TIMESTAMPTZ;

UPDATE scripture_item_memory
SET memorize_flow_step = CASE
  WHEN grip_status = 'completed' THEN 'completed'
  ELSE 'context'
END;

UPDATE scripture_item_memory
SET memorize_paraphrase = grasp_paraphrase
WHERE grasp_paraphrase IS NOT NULL AND memorize_paraphrase IS NULL;

UPDATE scripture_item_memory
SET grip_status = 'grasp'
WHERE grip_status IN ('recall', 'say');

ALTER TABLE scripture_item_memory
  ALTER COLUMN memorize_flow_step SET DEFAULT 'context',
  ALTER COLUMN memorize_flow_step SET NOT NULL;

ALTER TABLE scripture_item_memory
  ADD CONSTRAINT scripture_item_memory_memorize_flow_step_check
  CHECK (
    memorize_flow_step IN (
      'context',
      'phrases',
      'preview',
      'supported_recall',
      'full_recall',
      'completed'
    )
  );

COMMENT ON COLUMN scripture_item_memory.memorize_flow_step IS 'Structured memorization: context → phrases → preview → supported recall → full recall → completed.';
COMMENT ON COLUMN scripture_item_memory.phrase_segments IS 'User-defined phrase strings in order (JSON array of strings).';
COMMENT ON COLUMN scripture_item_memory.memorize_paraphrase IS 'Quick contextual study: user paraphrase.';
COMMENT ON COLUMN scripture_item_memory.memorize_meaning IS 'Quick contextual study: meaning in own words.';

COMMENT ON COLUMN scripture_item_memory.hold_status IS 'NULL until initial memorization completed; then Fresh | Strengthening | Established.';
