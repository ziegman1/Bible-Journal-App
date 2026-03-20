-- Add invited_by_name for email personalization and display
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS invited_by_name TEXT;
