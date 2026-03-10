# Supabase Integration – Setup Guide

## Environment Variables

**Required:** Add these to `.env.local` (already created with your keys):

| Variable | Description | Status |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | **Replace placeholder** – get from [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/_/settings/api) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key | Added (sb_publishable_...) |
| `OPENAI_API_KEY` | For Ask AI feature | Add if using AI |
| `NEXT_PUBLIC_SITE_URL` | Auth redirect base URL | Optional (defaults to localhost:3000) |

**Important:** Replace `https://YOUR_PROJECT_REF.supabase.co` in `.env.local` with your actual Supabase project URL (e.g. `https://abcdefgh.supabase.co`).

---

## SQL Migrations

Run these in order in the **Supabase SQL Editor** (Dashboard → SQL Editor):

### 1. `supabase/migrations/001_initial_schema.sql`
Creates: profiles, reading_sessions, ai_responses, tags, journal_entries, journal_entry_tags, highlights, favorite_passages, RLS policies, auth trigger.

### 2. `supabase/migrations/002_study_threads_and_extensions.sql`
Creates: study_threads, thread_messages. Adds: study_thread_id to journal_entries, reference/note to highlights, thread_id to ai_responses. RLS for new tables.

---

## Manual Supabase Setup

1. **Create project** at [supabase.com](https://supabase.com) if needed.
2. **Run migrations** in SQL Editor (001, then 002).
3. **Auth → Providers:** Enable Email in Authentication → Providers.
4. **Auth → URL Configuration:**
   - Site URL: `http://localhost:3000` (or `http://localhost:3001` if you run on that port)
   - Redirect URLs: add `http://localhost:3000/auth/callback`, `http://localhost:3001/auth/callback`, and your production callback URL
5. **Restart dev server** after updating `.env.local`.
6. **If you see "Unable to connect" / "fetch failed":**
   - Resume a paused Supabase project (Dashboard → Project Settings → General)
   - Confirm `NEXT_PUBLIC_SUPABASE_URL` is correct (no trailing slash)
   - If running on port 3001, set `NEXT_PUBLIC_SITE_URL=http://localhost:3001` in `.env.local`

---

## Behavior

- **Env vars missing:** App redirects `/app` and `/onboarding` to `/setup` with setup instructions.
- **Env vars present:** Full Supabase integration (auth, journal, threads, highlights, favorites, AI storage).
