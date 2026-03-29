-- Solo 3/3rds Look Up: structured passage (preset or manual) for in-app reading + passage_ref string.

ALTER TABLE thirds_personal_weeks
  ADD COLUMN IF NOT EXISTS look_up_preset_story_id UUID REFERENCES preset_stories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS look_up_book TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS look_up_chapter SMALLINT,
  ADD COLUMN IF NOT EXISTS look_up_verse_start SMALLINT,
  ADD COLUMN IF NOT EXISTS look_up_verse_end SMALLINT;

COMMENT ON COLUMN thirds_personal_weeks.look_up_preset_story_id IS
  'When set, passage coordinates match this preset_stories row.';
COMMENT ON COLUMN thirds_personal_weeks.look_up_book IS
  'Bible book display name for Look Up reader (WEB); empty when using reference-only mode.';
