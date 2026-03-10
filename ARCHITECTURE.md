# Bible Journal – Architecture Summary

## Overview

Bible Journal is a Scripture-first journaling platform built with Next.js 16 (App Router), Supabase, and OpenAI. Users read the Bible, ask AI questions about passages, save commentary, add reflections, and compile entries into an annual journal.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Base UI) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | OpenAI API (gpt-4o-mini) |
| Deployment | Vercel-ready |

## Folder Structure

```
src/
├── app/
│   ├── actions/           # Server actions
│   │   ├── auth.ts        # signUp, signIn, signOut
│   │   ├── ai.ts          # askPassageQuestion
│   │   ├── journal.ts     # saveReadingSession, createJournalEntry, updateJournalEntry
│   │   └── profile.ts     # updateProfile
│   ├── app/               # Protected routes (require auth + onboarding)
│   │   ├── page.tsx       # Dashboard
│   │   ├── read/          # Bible reader
│   │   ├── journal/       # Journal timeline + entry detail
│   │   ├── themes/        # Theme aggregation
│   │   ├── annual-journal/
│   │   └── settings/
│   ├── auth/callback/     # OAuth/email confirmation callback
│   ├── login/
│   ├── signup/
│   └── onboarding/
├── components/
│   ├── ui/                # shadcn components
│   ├── app-sidebar.tsx
│   ├── app-header.tsx
│   ├── reader-view.tsx
│   ├── ask-ai-panel.tsx
│   ├── journal-timeline.tsx
│   ├── journal-filters.tsx
│   ├── entry-editor.tsx
│   ├── onboarding-form.tsx
│   ├── settings-form.tsx
│   └── chapter-selector.tsx
├── lib/
│   ├── ai/
│   │   ├── client.ts      # OpenAI API calls
│   │   ├── prompt.ts      # System prompt builder
│   │   └── transform.ts   # JSON response parser
│   ├── scripture/
│   │   ├── provider.ts    # getChapter (abstraction)
│   │   ├── mock-data.ts   # Sample chapters
│   │   ├── books.ts       # Book metadata
│   │   └── types.ts
│   ├── supabase/
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── middleware.ts  # Session refresh + route protection
│   └── utils.ts
├── types/
│   └── database.ts        # Profile, JournalEntry, AIResponse, etc.
└── middleware.ts          # Auth middleware
```

## Data Flow

### Auth

1. User signs up → Supabase Auth → trigger creates profile (onboarding_complete: false)
2. User signs in → middleware refreshes session → redirect to /app
3. App layout checks onboarding_complete → redirect to /onboarding if false
4. Onboarding form submits → updateProfile(..., onboarding_complete: true) → redirect to /app

### Ask AI

1. User selects verse(s) in reader → AskAIPanel opens
2. User types question → askPassageQuestion server action
3. Server: getChapter (scripture provider) → build prompt → OpenAI API → parse JSON
4. Insert ai_responses row → return response to client
5. User adds reflection → Save to journal → createJournalEntry

### Journal

1. createJournalEntry inserts journal_entries + journal_entry_tags
2. Journal timeline fetches entries with filters (book, tag, month, search)
3. Entry detail page fetches entry + ai_response + tags
4. EntryEditor updates reflection, prayer, application, tags via updateJournalEntry

## Scripture Provider Abstraction

```
lib/scripture/
├── provider.ts   # getChapter(bookId, chapterNum) → Chapter | null
├── mock-data.ts  # Sample Psalm 23, John 3, Genesis 1, Matthew 5
├── books.ts      # BIBLE_BOOKS, getBookById, getBookByName
└── types.ts      # Chapter, Verse, ScriptureReference
```

To plug in a licensed Bible API:

1. Create `lib/scripture/api-provider.ts` that fetches from the API
2. Update `provider.ts` to use the API when configured, fallback to mock
3. Keep the same `Chapter` and `Verse` types

## AI Response Structure

OpenAI returns JSON:

```json
{
  "summary": "...",
  "context": "...",
  "meaning": "...",
  "themes": ["...", "..."],
  "crossReferences": [{ "reference": "...", "note": "..." }],
  "reflectionPrompt": "...",
  "applicationInsight": "..."
}
```

Stored in `ai_responses.response_json` (JSONB).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Supabase anon key |
| OPENAI_API_KEY | Yes | OpenAI API key (for Ask AI) |
| NEXT_PUBLIC_SITE_URL | No | Base URL for auth redirects |

## Database Schema (Summary)

- **profiles** – User preferences, onboarding_complete
- **reading_sessions** – Tracks reads (book, chapter, reference)
- **ai_responses** – AI commentary (response_json)
- **journal_entries** – Main journal (reflection, prayer, application, ai_response_id)
- **tags** – User-created tags
- **journal_entry_tags** – Many-to-many
- **highlights** – Verse highlights (for future use)
- **favorite_passages** – Saved passages (for future use)

RLS: All tables have policies so users only access their own data.
