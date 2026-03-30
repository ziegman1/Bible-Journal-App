-- BADWR - Study Threads & Schema Extensions
-- Run after 001_initial_schema.sql

-- 1. study_threads
CREATE TABLE study_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER,
  verse_end INTEGER,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_threads_user_id ON study_threads(user_id);
CREATE INDEX idx_study_threads_created_at ON study_threads(created_at DESC);

-- 2. thread_messages
CREATE TABLE thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES study_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  structured_ai_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_thread_messages_thread_id ON thread_messages(thread_id);
CREATE INDEX idx_thread_messages_created_at ON thread_messages(created_at DESC);

-- 3. Add study_thread_id to journal_entries (nullable for backwards compatibility)
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS study_thread_id UUID REFERENCES study_threads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_journal_entries_study_thread_id ON journal_entries(study_thread_id);

-- 4. Add reference and note columns to highlights (user's schema: reference, verse, note)
ALTER TABLE highlights
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT;

-- 5. Add thread_id to ai_responses for linking AI responses to study threads
ALTER TABLE ai_responses
  ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES study_threads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_responses_thread_id ON ai_responses(thread_id);

-- 6. RLS for study_threads
ALTER TABLE study_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own study_threads" ON study_threads
  FOR ALL USING (auth.uid() = user_id);

-- 7. RLS for thread_messages (via thread ownership)
ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage thread_messages for own threads" ON thread_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM study_threads st
      WHERE st.id = thread_messages.thread_id AND st.user_id = auth.uid()
    )
  );
