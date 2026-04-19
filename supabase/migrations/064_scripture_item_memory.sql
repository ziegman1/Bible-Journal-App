-- GRIP initial memorization progress per scripture item (hidden /scripture module). HOLD review not included.

CREATE TABLE scripture_item_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scripture_item_id UUID NOT NULL REFERENCES scripture_items(id) ON DELETE CASCADE,
  grip_status TEXT NOT NULL DEFAULT 'grasp' CHECK (grip_status IN ('grasp', 'recall', 'say', 'completed')),
  grasp_paraphrase TEXT,
  grasp_completed_at TIMESTAMPTZ,
  recall_completed_at TIMESTAMPTZ,
  say_completed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_started_at TIMESTAMPTZ,
  last_step_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scripture_item_id)
);

CREATE INDEX idx_scripture_item_memory_user ON scripture_item_memory (user_id);
CREATE INDEX idx_scripture_item_memory_status ON scripture_item_memory (user_id, grip_status);

COMMENT ON TABLE scripture_item_memory IS 'GRIP progress for a saved verse; one row per scripture_item.';

CREATE TRIGGER update_scripture_item_memory_updated_at
  BEFORE UPDATE ON scripture_item_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE scripture_item_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own scripture_item_memory"
  ON scripture_item_memory FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own scripture_item_memory"
  ON scripture_item_memory FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scripture_item_memory"
  ON scripture_item_memory FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own scripture_item_memory"
  ON scripture_item_memory FOR DELETE USING (auth.uid() = user_id);
