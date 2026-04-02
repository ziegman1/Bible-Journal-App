-- Supabase Realtime: include full new (and old) row on UPDATE/DELETE for postgres_changes.
-- Without FULL, WAL often omits unchanged TOASTed TEXT columns; clients then merge partial
-- payloads and keep stale values (e.g. edited prayer / pastoral_care_response not updating
-- for other participants). Same pattern as 029_meeting_commitment_checkoffs_replica_identity.sql.

ALTER TABLE public.lookback_responses REPLICA IDENTITY FULL;
ALTER TABLE public.lookforward_responses REPLICA IDENTITY FULL;
ALTER TABLE public.prior_obedience_followups REPLICA IDENTITY FULL;
ALTER TABLE public.passage_observations REPLICA IDENTITY FULL;
