-- Supabase Realtime: send full row on UPDATE/DELETE so clients can merge checkoffs
-- (default replica identity only includes PK in old_record for DELETE).
ALTER TABLE public.meeting_commitment_checkoffs REPLICA IDENTITY FULL;
