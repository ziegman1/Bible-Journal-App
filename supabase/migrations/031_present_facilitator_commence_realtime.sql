-- One-time live facilitator pick when TV / present view opens; broadcast facilitator changes to clients.

ALTER TABLE group_meetings
  ADD COLUMN IF NOT EXISTS present_facilitator_commenced_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN group_meetings.present_facilitator_commenced_at IS
  'Set when Facilitator view first commences this meeting; used to run live facilitator assignment once.';

ALTER PUBLICATION supabase_realtime ADD TABLE group_meetings;
