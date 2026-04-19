-- Personal "My Verses" queue for Scripture Memory: user adds passages from lists; memorization runs from this queue.

CREATE TABLE scripture_my_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_list_id UUID REFERENCES scripture_lists(id) ON DELETE SET NULL,
  scripture_item_id UUID NOT NULL REFERENCES scripture_items(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  passage_text TEXT NOT NULL,
  sort_order INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  current_stage TEXT,
  mastered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scripture_my_verses_user_item_unique UNIQUE (user_id, scripture_item_id),
  CONSTRAINT scripture_my_verses_reference_nonempty CHECK (btrim(reference) <> ''),
  CONSTRAINT scripture_my_verses_passage_nonempty CHECK (btrim(passage_text) <> '')
);

CREATE INDEX idx_scripture_my_verses_user_sort ON scripture_my_verses (user_id, sort_order ASC);

COMMENT ON TABLE scripture_my_verses IS 'User queue for Scripture Memory; order is deterministic via sort_order.';

CREATE TRIGGER update_scripture_my_verses_updated_at
  BEFORE UPDATE ON scripture_my_verses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE scripture_my_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own scripture_my_verses"
  ON scripture_my_verses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own scripture_my_verses"
  ON scripture_my_verses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scripture_my_verses"
  ON scripture_my_verses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own scripture_my_verses"
  ON scripture_my_verses FOR DELETE USING (auth.uid() = user_id);
