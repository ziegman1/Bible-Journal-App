-- Backfill meeting_participants for members who joined the group after a meeting was created.
-- UI now shows the full group roster merged with these rows; this keeps the table aligned for analytics and any future logic.

INSERT INTO meeting_participants (meeting_id, user_id, present, joined_at)
SELECT gm.id, gmem.user_id, true, NOW()
FROM group_meetings gm
JOIN group_members gmem ON gmem.group_id = gm.group_id
ON CONFLICT (meeting_id, user_id) DO NOTHING;
