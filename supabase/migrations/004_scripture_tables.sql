-- BADWR - Scripture Database (WEB / World English Bible)
-- Run after 003_ai_usage_rate_limit.sql

-- 1. books
CREATE TABLE scripture_books (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('old', 'new')),
  book_order INTEGER NOT NULL UNIQUE
);

CREATE INDEX idx_scripture_books_order ON scripture_books(book_order);

-- 2. chapters (denormalized for fast lookup - chapter_number per book)
CREATE TABLE scripture_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES scripture_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  UNIQUE(book_id, chapter_number)
);

CREATE INDEX idx_scripture_chapters_book ON scripture_chapters(book_id);
CREATE INDEX idx_scripture_chapters_book_chapter ON scripture_chapters(book_id, chapter_number);

-- 3. verses (with optional translation for future ESV, NIV, etc.)
CREATE TABLE scripture_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES scripture_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'web',
  UNIQUE(book_id, chapter_number, verse_number, translation)
);

CREATE INDEX idx_scripture_verses_book ON scripture_verses(book_id);
CREATE INDEX idx_scripture_verses_chapter ON scripture_verses(book_id, chapter_number);
CREATE INDEX idx_scripture_verses_lookup ON scripture_verses(book_id, chapter_number, verse_number);
CREATE INDEX idx_scripture_verses_translation ON scripture_verses(translation);

-- RLS: scripture tables are read-only for all authenticated users
ALTER TABLE scripture_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scripture_books" ON scripture_books FOR SELECT USING (true);
CREATE POLICY "Anyone can read scripture_chapters" ON scripture_chapters FOR SELECT USING (true);
CREATE POLICY "Anyone can read scripture_verses" ON scripture_verses FOR SELECT USING (true);
