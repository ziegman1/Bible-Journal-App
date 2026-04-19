-- Allow members to delete their own CHAT weekly check-in rows (e.g. weekly log “no record” / clear).
-- Formation-momentum and streaks read absence as no row; explicit delete matches that model.

CREATE POLICY "Members delete own chat_reading_check_ins"
  ON chat_reading_check_ins FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Members delete own chat_reading_check_ins" ON chat_reading_check_ins IS
  'Owner may remove a week row when correcting history (weekly log tool).';
