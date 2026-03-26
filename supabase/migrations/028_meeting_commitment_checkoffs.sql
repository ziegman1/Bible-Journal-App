-- Per-commitment checkoffs during accountability check-up (any group member may toggle).
-- Carry-forward: unchecked items from source_meeting_id remain for the next meeting's list.

CREATE TABLE meeting_commitment_checkoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  source_meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  subject_user_id UUID NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('obedience', 'sharing', 'train')),
  is_complete BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT meeting_commitment_checkoffs_unique UNIQUE (meeting_id, source_meeting_id, subject_user_id, pillar)
);

CREATE INDEX idx_meeting_commitment_checkoffs_meeting_id ON meeting_commitment_checkoffs(meeting_id);

ALTER TABLE meeting_commitment_checkoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view commitment checkoffs"
  ON meeting_commitment_checkoffs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_commitment_checkoffs.meeting_id
    )
  );

CREATE POLICY "Group members can insert commitment checkoffs"
  ON meeting_commitment_checkoffs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_commitment_checkoffs.meeting_id
    )
    AND updated_by = auth.uid()
  );

CREATE POLICY "Group members can update commitment checkoffs"
  ON meeting_commitment_checkoffs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_commitment_checkoffs.meeting_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_commitment_checkoffs.meeting_id
    )
  );

CREATE POLICY "Group members can delete commitment checkoffs"
  ON meeting_commitment_checkoffs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem ON gmem.group_id = gm.group_id AND gmem.user_id = auth.uid()
      WHERE gm.id = meeting_commitment_checkoffs.meeting_id
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE meeting_commitment_checkoffs;
