-- Remove duplicate preset_stories rows (e.g. from re-running seed). Matches app dedupe key:
-- series (case-insensitive) + series_order + book + chapter + verses + title.
-- Repoint FKs to the canonical row (oldest by created_at, then id) before delete.

UPDATE group_meetings gm
SET preset_story_id = sub.keep_id
FROM (
  WITH ranked AS (
    SELECT
      id,
      FIRST_VALUE(id) OVER (
        PARTITION BY
          COALESCE(TRIM(LOWER(series_name)), ''),
          COALESCE(series_order, -1),
          TRIM(LOWER(book)),
          chapter,
          verse_start,
          verse_end,
          TRIM(LOWER(title))
        ORDER BY created_at ASC, id ASC
      ) AS keep_id
    FROM preset_stories
  )
  SELECT id AS dup_id, keep_id FROM ranked WHERE id <> keep_id
) sub
WHERE gm.preset_story_id = sub.dup_id;

UPDATE thirds_personal_weeks w
SET look_up_preset_story_id = sub.keep_id
FROM (
  WITH ranked AS (
    SELECT
      id,
      FIRST_VALUE(id) OVER (
        PARTITION BY
          COALESCE(TRIM(LOWER(series_name)), ''),
          COALESCE(series_order, -1),
          TRIM(LOWER(book)),
          chapter,
          verse_start,
          verse_end,
          TRIM(LOWER(title))
        ORDER BY created_at ASC, id ASC
      ) AS keep_id
    FROM preset_stories
  )
  SELECT id AS dup_id, keep_id FROM ranked WHERE id <> keep_id
) sub
WHERE w.look_up_preset_story_id = sub.dup_id;

DELETE FROM preset_stories ps
USING (
  WITH ranked AS (
    SELECT
      id,
      FIRST_VALUE(id) OVER (
        PARTITION BY
          COALESCE(TRIM(LOWER(series_name)), ''),
          COALESCE(series_order, -1),
          TRIM(LOWER(book)),
          chapter,
          verse_start,
          verse_end,
          TRIM(LOWER(title))
        ORDER BY created_at ASC, id ASC
      ) AS keep_id
    FROM preset_stories
  )
  SELECT id AS dup_id FROM ranked WHERE id <> keep_id
) sub
WHERE ps.id = sub.dup_id;
