-- Add invitee name to group_invites for email personalization and display
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS invitee_name TEXT;
