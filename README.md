# BADWR – Be a Disciple Worth Reproducing

A Scripture-first journaling platform where users read the Bible, ask AI questions, save commentary, add reflections, and compile everything into a structured yearly journal.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase** (auth + database)
- **OpenAI** (AI commentary)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- `OPENAI_API_KEY` – OpenAI API key (for Ask AI)

Optional:

- `NEXT_PUBLIC_SITE_URL` – Base URL for auth redirects (default: `http://localhost:3000`)

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the migration:

   `supabase/migrations/001_initial_schema.sql`

3. Enable Email auth in Authentication → Providers
4. Add your site URL to Authentication → URL Configuration (e.g. `http://localhost:3000`)

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

### Folder structure

```
src/
├── app/
│   ├── actions/          # Server actions (auth, ai, journal, profile)
│   ├── app/              # Protected app routes
│   │   ├── read/         # Bible reader
│   │   ├── journal/      # Journal timeline & entries
│   │   ├── themes/       # Theme aggregation
│   │   ├── annual-journal/
│   │   └── settings/
│   ├── auth/             # Auth callback
│   ├── login/
│   └── signup/
├── components/
├── lib/
│   ├── ai/               # OpenAI client, prompts, transform
│   ├── scripture/        # Bible provider, mock data, books
│   └── supabase/         # Client, server, middleware
└── types/
```

### Database schema

- **profiles** – User preferences (display name, reading mode, AI style)
- **reading_sessions** – Tracks what the user has read
- **ai_responses** – Stores AI commentary with structured JSON
- **journal_entries** – Main journal records (reflection, prayer, application)
- **tags** / **journal_entry_tags** – Theme/tag system
- **highlights** – Verse highlights
- **favorite_passages** – Saved passages

### Scripture provider

Bible text is abstracted in `lib/scripture/`:

- `provider.ts` – Main API (`getChapter`)
- `mock-data.ts` – Sample chapters (Psalm 23, John 3, Genesis 1, Matthew 5)
- `books.ts` – Book metadata

Replace the mock implementation with a licensed Bible API when ready.

## Features

- **Auth** – Sign up, sign in, sign out
- **Onboarding** – Display name, reading mode, journal year
- **Dashboard** – Continue reading, recent entries, stats
- **Bible reader** – Book/chapter navigation, verse selection
- **Ask AI** – Question about passage → structured response → save to journal
- **Journal** – Timeline, filters (book, tag, month, search), entry detail
- **Themes** – Tag aggregation
- **Annual journal** – Year summary, top themes, entries by month
- **Settings** – Profile, reading mode, AI style

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

Ensure `NEXT_PUBLIC_SITE_URL` is set to your production URL and add it to Supabase auth redirect URLs.
