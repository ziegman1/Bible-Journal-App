-- Realtime for per-user meeting responses (live group / facilitator view).

ALTER PUBLICATION supabase_realtime ADD TABLE lookback_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE lookforward_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE prior_obedience_followups;
