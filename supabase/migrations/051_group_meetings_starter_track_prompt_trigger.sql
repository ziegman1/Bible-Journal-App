-- Enforce the same "answer 3/3rds prompt before first real meeting" rule at the database layer.
-- RLS allows any group member to INSERT group_meetings; without this, a custom client could bypass
-- createGroupMeeting (see src/app/actions/meetings.ts).

CREATE OR REPLACE FUNCTION public.assert_starter_track_prompt_before_group_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind TEXT;
  v_answered BOOLEAN;
  v_pending BOOLEAN;
  v_members INT;
BEGIN
  SELECT
    COALESCE(group_kind, 'thirds'),
    starter_track_prompt_answered,
    onboarding_pending
  INTO v_kind, v_answered, v_pending
  FROM groups
  WHERE id = NEW.group_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_kind = 'chat' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::INT INTO v_members FROM group_members WHERE group_id = NEW.group_id;
  IF v_members < 2 THEN
    RETURN NEW;
  END IF;

  -- Mirrors src/lib/groups/starter-track-prompt.ts::groupNeedsStarterTrackPrompt
  IF v_answered IS FALSE THEN
    RAISE EXCEPTION 'Complete the group 3/3rds onboarding prompt before creating meetings';
  END IF;

  IF v_answered IS NULL AND v_pending IS TRUE THEN
    RAISE EXCEPTION 'Complete the group 3/3rds onboarding prompt before creating meetings';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_meetings_starter_track_prompt ON group_meetings;
CREATE TRIGGER trg_group_meetings_starter_track_prompt
  BEFORE INSERT ON group_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.assert_starter_track_prompt_before_group_meeting();

COMMENT ON FUNCTION public.assert_starter_track_prompt_before_group_meeting() IS
  'Blocks INSERT into group_meetings for 3/3rds groups until starter_track_prompt_answered is resolved (matches app gate).';
