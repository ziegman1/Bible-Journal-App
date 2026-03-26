-- Allow commissioning step after prayer (Look Forward conclusion slide).

ALTER TABLE meeting_presenter_state
  DROP CONSTRAINT IF EXISTS meeting_presenter_state_forward_sub_check;

ALTER TABLE meeting_presenter_state
  ADD CONSTRAINT meeting_presenter_state_forward_sub_check
  CHECK (forward_sub IN ('obey', 'practice', 'prayer', 'commissioning'));
