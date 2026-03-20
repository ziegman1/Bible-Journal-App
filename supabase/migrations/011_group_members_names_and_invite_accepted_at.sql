-- Add first_name, last_name, email to group_members for group-specific member display
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS email TEXT;

-- Add accepted_at to group_invites
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
