-- WEB Bible Data Integrity - SQL checks for Supabase SQL Editor
-- Run these in Supabase Dashboard → SQL Editor

-- 1. Book count (expected: 66)
SELECT COUNT(*) AS book_count FROM scripture_books;

-- 2. Chapter count (expected: 1189)
SELECT COUNT(*) AS chapter_count FROM scripture_chapters;

-- 3. Verse count (expected: ~31098-31102 for WEB/WMB)
SELECT COUNT(*) AS verse_count FROM scripture_verses WHERE translation = 'web';

-- 4. James exists and verse count (expected: 108)
SELECT b.id, b.name, COUNT(v.id) AS verse_count
FROM scripture_books b
LEFT JOIN scripture_verses v ON v.book_id = b.id AND v.translation = 'web'
WHERE b.id = 'james'
GROUP BY b.id, b.name;

-- 5. Jude exists and verse count (expected: 25)
SELECT b.id, b.name, COUNT(v.id) AS verse_count
FROM scripture_books b
LEFT JOIN scripture_verses v ON v.book_id = b.id AND v.translation = 'web'
WHERE b.id = 'jude'
GROUP BY b.id, b.name;

-- 6. List all books with verse counts (verify ordering)
SELECT b.id, b.name, b.testament, b.book_order, COUNT(v.id) AS verses
FROM scripture_books b
LEFT JOIN scripture_verses v ON v.book_id = b.id AND v.translation = 'web'
GROUP BY b.id, b.name, b.testament, b.book_order
ORDER BY b.book_order;
