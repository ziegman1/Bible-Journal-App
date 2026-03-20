-- Track last time an invite email was sent (initial send + resends)
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

UPDATE group_invites SET last_sent_at = created_at WHERE last_sent_at IS NULL;
