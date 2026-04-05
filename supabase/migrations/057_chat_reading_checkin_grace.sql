-- Explicit reading grace from CHAT accountability Q18 (meeting page): one apply per practice week per group.

ALTER TABLE chat_group_reading_pace
  ADD COLUMN IF NOT EXISTS explicit_reading_grace_week_start DATE;

COMMENT ON COLUMN chat_group_reading_pace.explicit_reading_grace_week_start IS
  'Sunday (practice week) when explicit Q18 grace last realigned the pair; blocks a second grace the same week.';

CREATE TABLE IF NOT EXISTS chat_reading_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_ymd DATE NOT NULL,
  kept_up BOOLEAN NOT NULL,
  restart_book_id TEXT,
  restart_chapter SMALLINT CHECK (restart_chapter IS NULL OR restart_chapter >= 1),
  grace_was_applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id, week_start_ymd)
);

CREATE INDEX IF NOT EXISTS idx_chat_reading_check_ins_group_week
  ON chat_reading_check_ins (group_id, week_start_ymd DESC);

COMMENT ON TABLE chat_reading_check_ins IS
  'Weekly CHAT reading check-in (Q18): kept up with reading, optional restart chapter when not; grace_was_applied when pair pace was realigned that submit.';

ALTER TABLE chat_reading_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members read chat_reading_check_ins"
  ON chat_reading_check_ins FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Members insert own chat_reading_check_ins"
  ON chat_reading_check_ins FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Members update own chat_reading_check_ins"
  ON chat_reading_check_ins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_group_member(group_id, auth.uid())
  );

CREATE OR REPLACE TRIGGER update_chat_reading_check_ins_updated_at
  BEFORE UPDATE ON chat_reading_check_ins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Align pace + every member bookmark; RLS would block cross-user updates from the app.
CREATE OR REPLACE FUNCTION apply_chat_reading_grace_for_group(
  p_group_id UUID,
  p_actor_user_id UUID,
  p_week_start_ymd DATE,
  p_reading_start_date DATE,
  p_pair_shared_chapters INTEGER,
  p_restart_book_id TEXT,
  p_restart_chapter INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g_kind TEXT;
  pace_rec chat_group_reading_pace%ROWTYPE;
BEGIN
  IF NOT is_group_member(p_group_id, p_actor_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_member');
  END IF;

  SELECT group_kind INTO g_kind FROM groups WHERE id = p_group_id;
  IF g_kind IS DISTINCT FROM 'chat' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_chat');
  END IF;

  IF p_pair_shared_chapters IS NULL OR p_pair_shared_chapters < 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_chapters');
  END IF;

  IF p_restart_book_id IS NULL OR trim(p_restart_book_id) = '' OR p_restart_chapter IS NULL OR p_restart_chapter < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_restart');
  END IF;

  SELECT * INTO pace_rec FROM chat_group_reading_pace WHERE group_id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_pace_row');
  END IF;

  IF pace_rec.explicit_reading_grace_week_start IS NOT NULL
     AND pace_rec.explicit_reading_grace_week_start = p_week_start_ymd THEN
    RETURN jsonb_build_object('ok', true, 'grace_applied', false, 'reason', 'duplicate_week');
  END IF;

  UPDATE chat_group_reading_pace
  SET
    reading_start_date = p_reading_start_date,
    pair_shared_chapters_from_plan = p_pair_shared_chapters,
    explicit_reading_grace_week_start = p_week_start_ymd,
    updated_at = now()
  WHERE group_id = p_group_id;

  INSERT INTO chat_soaps_reading_progress (user_id, group_id, book_id, last_completed_chapter, updated_at)
  SELECT gm.user_id, p_group_id, trim(p_restart_book_id), p_restart_chapter, now()
  FROM group_members gm
  WHERE gm.group_id = p_group_id
  ON CONFLICT (user_id, group_id) DO UPDATE SET
    book_id = EXCLUDED.book_id,
    last_completed_chapter = EXCLUDED.last_completed_chapter,
    updated_at = now();

  RETURN jsonb_build_object('ok', true, 'grace_applied', true);
END;
$$;

REVOKE ALL ON FUNCTION apply_chat_reading_grace_for_group(
  UUID, UUID, DATE, DATE, INTEGER, TEXT, INTEGER
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION apply_chat_reading_grace_for_group(
  UUID, UUID, DATE, DATE, INTEGER, TEXT, INTEGER
) TO authenticated;

COMMENT ON FUNCTION apply_chat_reading_grace_for_group IS
  'CHAT Q18: reset reading_start_date, pair_shared_chapters_from_plan, and all members SOAPS bookmarks to the chosen restart (one grace per p_week_start_ymd).';
