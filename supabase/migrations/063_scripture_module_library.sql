-- Hidden /scripture module: user scripture library (items, lists, assignments).
-- GRIP/HOLD not included in this phase.

CREATE TABLE scripture_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  translation TEXT,
  verse_text TEXT NOT NULL,
  notes TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scripture_items_reference_nonempty CHECK (btrim(reference) <> ''),
  CONSTRAINT scripture_items_verse_nonempty CHECK (btrim(verse_text) <> '')
);

CREATE INDEX idx_scripture_items_user_created ON scripture_items (user_id, created_at DESC);

CREATE TABLE scripture_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scripture_lists_name_nonempty CHECK (btrim(name) <> '')
);

CREATE UNIQUE INDEX scripture_lists_user_name_lower ON scripture_lists (user_id, lower(btrim(name)));

CREATE INDEX idx_scripture_lists_user ON scripture_lists (user_id, created_at DESC);

CREATE TABLE scripture_item_lists (
  scripture_item_id UUID NOT NULL REFERENCES scripture_items(id) ON DELETE CASCADE,
  scripture_list_id UUID NOT NULL REFERENCES scripture_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scripture_item_id, scripture_list_id)
);

CREATE INDEX idx_scripture_item_lists_list ON scripture_item_lists (scripture_list_id);

COMMENT ON TABLE scripture_items IS 'User-saved verses for the hidden /scripture module.';
COMMENT ON TABLE scripture_lists IS 'Named verse collections for the hidden /scripture module.';
COMMENT ON TABLE scripture_item_lists IS 'Many-to-many: verse in list.';

CREATE TRIGGER update_scripture_items_updated_at
  BEFORE UPDATE ON scripture_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scripture_lists_updated_at
  BEFORE UPDATE ON scripture_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE scripture_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_item_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own scripture_items"
  ON scripture_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own scripture_items"
  ON scripture_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scripture_items"
  ON scripture_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own scripture_items"
  ON scripture_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users select own scripture_lists"
  ON scripture_lists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own scripture_lists"
  ON scripture_lists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scripture_lists"
  ON scripture_lists FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own scripture_lists"
  ON scripture_lists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users select own scripture_item_lists"
  ON scripture_item_lists FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM scripture_items i WHERE i.id = scripture_item_id AND i.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM scripture_lists l WHERE l.id = scripture_list_id AND l.user_id = auth.uid())
  );

CREATE POLICY "Users insert own scripture_item_lists"
  ON scripture_item_lists FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM scripture_items i WHERE i.id = scripture_item_id AND i.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM scripture_lists l WHERE l.id = scripture_list_id AND l.user_id = auth.uid())
  );

CREATE POLICY "Users delete own scripture_item_lists"
  ON scripture_item_lists FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM scripture_items i WHERE i.id = scripture_item_id AND i.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM scripture_lists l WHERE l.id = scripture_list_id AND l.user_id = auth.uid())
  );
