-- Per-line flag: user selects up to 5 List of 100 names for weekly CHAT evangelistic prayer focus (enforced in app).

ALTER TABLE relational_network_list_entries
  ADD COLUMN IF NOT EXISTS is_evangelistic_prayer_focus BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN relational_network_list_entries.is_evangelistic_prayer_focus IS
  'When true, this name is part of the user''s current evangelistic prayer focus (max 5) for CHAT.';
