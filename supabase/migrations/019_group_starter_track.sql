-- Starter Track: per-group enrollment + optional meeting.week link for progress

CREATE TABLE group_starter_track_enrollment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  track_slug TEXT NOT NULL DEFAULT 'starter_v1',
  intro_completed_at TIMESTAMPTZ,
  vision_statement TEXT,
  vision_completed_at TIMESTAMPTZ,
  weeks_completed INT NOT NULL DEFAULT 0 CHECK (weeks_completed >= 0 AND weeks_completed <= 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id)
);

CREATE INDEX idx_group_starter_track_enrollment_group_id
  ON group_starter_track_enrollment(group_id);

CREATE TRIGGER update_group_starter_track_enrollment_updated_at
  BEFORE UPDATE ON group_starter_track_enrollment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE group_meetings
  ADD COLUMN starter_track_week INT NULL
  CHECK (starter_track_week IS NULL OR (starter_track_week >= 1 AND starter_track_week <= 8));

CREATE INDEX idx_group_meetings_starter_track_week
  ON group_meetings(group_id, starter_track_week)
  WHERE starter_track_week IS NOT NULL;

ALTER TABLE group_starter_track_enrollment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view starter track enrollment"
  ON group_starter_track_enrollment FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can insert starter track enrollment"
  ON group_starter_track_enrollment FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can update starter track enrollment"
  ON group_starter_track_enrollment FOR UPDATE
  USING (is_group_member(group_id, auth.uid()));
