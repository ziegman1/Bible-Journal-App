-- Granular home dashboard layout for custom experience (tool/widget ids).
-- Legacy `custom_dashboard_modules` (section-level) remains for backfill; the app migrates on read and new saves write only `custom_dashboard_items`.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_dashboard_items jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.custom_dashboard_items IS 'Ordered JSON array of dashboard item ids (tool-level); see src/lib/app-experience-mode/dashboard-items.ts';
