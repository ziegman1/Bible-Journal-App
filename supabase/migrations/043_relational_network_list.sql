-- "List of 100" / Relational Network Stewardship worksheet (per user, up to 100 lines).

CREATE TABLE IF NOT EXISTS relational_network_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  line_number SMALLINT NOT NULL CHECK (line_number >= 1 AND line_number <= 100),
  name TEXT NOT NULL DEFAULT '',
  invite_planned_date DATE,
  spiritual_status TEXT CHECK (
    spiritual_status IS NULL
    OR spiritual_status IN ('believer', 'unknown', 'unbeliever')
  ),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT relational_network_list_entries_user_line UNIQUE (user_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_relational_network_list_user_line
  ON relational_network_list_entries (user_id, line_number);

COMMENT ON TABLE relational_network_list_entries IS
  'Relational network stewardship list (up to 100 names per user).';

ALTER TABLE relational_network_list_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own relational network list"
  ON relational_network_list_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own relational network list rows"
  ON relational_network_list_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own relational network list rows"
  ON relational_network_list_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own relational network list rows"
  ON relational_network_list_entries FOR DELETE
  USING (auth.uid() = user_id);
