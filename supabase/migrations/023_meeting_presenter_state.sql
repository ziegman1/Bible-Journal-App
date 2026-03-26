-- Shared facilitator / presenter progression for a meeting (TV + participant sync).

CREATE TABLE meeting_presenter_state (
  meeting_id UUID PRIMARY KEY REFERENCES group_meetings(id) ON DELETE CASCADE,
  active_third SMALLINT NOT NULL DEFAULT 1 CHECK (active_third BETWEEN 1 AND 3),
  look_back_slide SMALLINT NOT NULL DEFAULT 0 CHECK (look_back_slide BETWEEN 0 AND 2),
  look_up_phase TEXT NOT NULL DEFAULT 'read'
    CHECK (look_up_phase IN ('read', 'retell', 'like', 'difficult', 'reread', 'people', 'god')),
  read_chunk_index INTEGER NOT NULL DEFAULT 0 CHECK (read_chunk_index >= 0),
  reread_chunk_index INTEGER NOT NULL DEFAULT 0 CHECK (reread_chunk_index >= 0),
  forward_sub TEXT NOT NULL DEFAULT 'obey'
    CHECK (forward_sub IN ('obey', 'practice', 'prayer')),
  practice_slide_index INTEGER NOT NULL DEFAULT 0 CHECK (practice_slide_index >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_meeting_presenter_state_updated_at ON meeting_presenter_state(updated_at DESC);

ALTER TABLE meeting_presenter_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meeting presenter state: group members can read"
  ON meeting_presenter_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM group_meetings gm
      JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_presenter_state.meeting_id
    )
  );

CREATE POLICY "Meeting presenter state: group members can insert"
  ON meeting_presenter_state FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM group_meetings gm
      JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_presenter_state.meeting_id
    )
  );

CREATE POLICY "Meeting presenter state: group members can update"
  ON meeting_presenter_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM group_meetings gm
      JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_presenter_state.meeting_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM group_meetings gm
      JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_presenter_state.meeting_id
    )
  );

-- One row per meeting; create when meeting is created.
CREATE OR REPLACE FUNCTION public.ensure_meeting_presenter_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.meeting_presenter_state (meeting_id)
  VALUES (NEW.id)
  ON CONFLICT (meeting_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_group_meetings_presenter_state
  AFTER INSERT ON group_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_meeting_presenter_state();

-- Backfill existing meetings
INSERT INTO meeting_presenter_state (meeting_id)
SELECT gm.id
FROM group_meetings gm
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_presenter_state mps WHERE mps.meeting_id = gm.id
);

-- Realtime (Supabase): replicate row changes to subscribed clients
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_presenter_state;
