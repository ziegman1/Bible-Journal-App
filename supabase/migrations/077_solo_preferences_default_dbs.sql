-- Default new solo Look Up preference rows to DBS (application still infers devotional for legacy weeks without a row).

ALTER TABLE thirds_solo_user_preferences
  ALTER COLUMN solo_look_up_mode SET DEFAULT 'dbs';
