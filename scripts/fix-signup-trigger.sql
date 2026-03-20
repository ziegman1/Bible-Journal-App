-- Fix signup / profile creation issues
-- Run in Supabase SQL Editor if new users get "database error" on signup
-- See SUPABASE_SETUP.md for full migration order

-- 1. Verify profiles table exists (run 001_initial_schema.sql if not)
-- SELECT * FROM profiles LIMIT 1;

-- 2. Recreate the trigger (fixes "relation does not exist" or trigger errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Reader')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Backfill any users who signed up but have no profile (run if needed)
-- INSERT INTO public.profiles (id, display_name)
-- SELECT id, COALESCE(raw_user_meta_data->>'display_name', 'Reader')
-- FROM auth.users u
-- WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
-- ON CONFLICT (id) DO NOTHING;
