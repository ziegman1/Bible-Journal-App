-- How performance-oriented the app feels
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS growth_mode text NOT NULL DEFAULT 'focused'
    CHECK (growth_mode IN ('guided', 'intentional', 'focused'));

COMMENT ON COLUMN public.profiles.growth_mode IS 'guided = tools-first minimal metrics; intentional = balanced; focused = full BADWR tracking (default).';

