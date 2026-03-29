-- Allow users to delete their own prayer logs (for “reset this week” on the Prayer page).

CREATE POLICY "Users delete own prayer wheel completions"
  ON prayer_wheel_segment_completions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own prayer extra minutes"
  ON prayer_extra_minutes FOR DELETE
  USING (auth.uid() = user_id);
