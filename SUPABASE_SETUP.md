# Supabase Integration – Setup Guide

## Environment Variables

**Required:** Add these to `.env.local` (already created with your keys):

| Variable | Description | Status |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | **Replace placeholder** – get from [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/_/settings/api) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key | Added (sb_publishable_...) |
| `OPENAI_API_KEY` | For Ask AI feature | Add if using AI |
| `NEXT_PUBLIC_SITE_URL` | Auth / invite email links (e.g. `https://www.logosflow.app`) | **Required in production** on Vercel (see below) |

**Important:** Replace `https://YOUR_PROJECT_REF.supabase.co` in `.env.local` with your actual Supabase project URL (e.g. `https://abcdefgh.supabase.co`).

---

## SQL Migrations

Run these in order in the **Supabase SQL Editor** (Dashboard → SQL Editor):

### 1. `supabase/migrations/001_initial_schema.sql`
Creates: profiles, reading_sessions, ai_responses, tags, journal_entries, journal_entry_tags, highlights, favorite_passages, RLS policies, auth trigger.

### 2. `supabase/migrations/002_study_threads_and_extensions.sql`
Creates: study_threads, thread_messages. Adds: study_thread_id to journal_entries, reference/note to highlights, thread_id to ai_responses. RLS for new tables.

### 3. `supabase/migrations/003_ai_usage_rate_limit.sql`
Creates: ai_usage table for daily AI request tracking (25 per user per day, UTC). Adds `increment_ai_usage` RPC for atomic rate limiting.

### 4. `supabase/migrations/004_scripture_tables.sql`
Creates: scripture_books, scripture_chapters, scripture_verses for World English Bible (WEB). Run the import script after this migration.

### 5. `supabase/migrations/005_fix_signup_trigger.sql`
Fixes "database error saving new user" on signup. Updates handle_new_user trigger with proper search_path.

### 6. `supabase/migrations/006_insight_summaries.sql`
Creates: insight_summaries table for caching AI-generated insight summaries (user, range, dates, JSON).

---

## Manual Supabase Setup

1. **Create project** at [supabase.com](https://supabase.com) if needed.
2. **Run migrations** in SQL Editor (001, 002, 003, 004, 005, then 006).
3. **Import WEB Bible:** `npm run import-web` (requires SUPABASE_SERVICE_ROLE_KEY in .env.local).
4. **Validate import:** `npm run validate-web` (checks 66 books, James, Jude, verse counts).
5. **Auth → Providers:** Enable Email in Authentication → Providers.
6. **Auth → URL Configuration** (critical for email confirmation links):
   - **Site URL:** `https://www.logosflow.app` (must be production for live users)
   - **Redirect URLs:** add `https://www.logosflow.app/auth/callback`, `http://localhost:3000/auth/callback`, `http://localhost:3001/auth/callback`
   - If Site URL is localhost, confirmation emails will link to localhost and users get a blank screen.
   - **Vercel:** Set `NEXT_PUBLIC_SITE_URL=https://www.logosflow.app` for every Production deploy. The app also falls back to `VERCEL_URL` if this is missing, but your **canonical domain** should be explicit. Old emails that already contain `localhost` cannot be fixed—ask the user to sign up again from production or use “Resend confirmation” after fixing env + Supabase Site URL.
7. **Restart dev server** after updating `.env.local`.
8. **If you see "Unable to connect" / "fetch failed":**
   - Resume a paused Supabase project (Dashboard → Project Settings → General)
   - Confirm `NEXT_PUBLIC_SUPABASE_URL` is correct (no trailing slash)
   - If running on port 3001, set `NEXT_PUBLIC_SITE_URL=http://localhost:3001` in `.env.local`

---

## Behavior

- **Env vars missing:** App redirects `/app` and `/onboarding` to `/setup` with setup instructions.
- **Env vars present:** Full Supabase integration (auth, journal, threads, highlights, favorites, AI storage).
