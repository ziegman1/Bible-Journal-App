-- Structured preset series catalog (Creation → Christ; Hope; Commands of Christ)
-- Regenerate: node scripts/build-preset-series-migration.cjs

ALTER TABLE preset_stories
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phase_title TEXT,
  ADD COLUMN IF NOT EXISTS story_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS command_ref TEXT,
  ADD COLUMN IF NOT EXISTS story_ref TEXT,
  ADD COLUMN IF NOT EXISTS passage_segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS additional_refs TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS deprecated BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_preset_stories_deprecated ON preset_stories (deprecated) WHERE deprecated = true;

UPDATE preset_stories SET deprecated = true WHERE slug IS NULL;

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-01-creation'),
  'Creation',
  'Passage:
Genesis 1',
  'Genesis', 1, 1, 31,
  'Creation to Christ Series', 0, 'ctc-dg-01-creation',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Genesis","chapter":1,"verse_start":1,"verse_end":31}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-02-creation-of-people'),
  'Creation of People',
  'Passage:
Genesis 2',
  'Genesis', 2, 1, 25,
  'Creation to Christ Series', 1, 'ctc-dg-02-creation-of-people',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Genesis","chapter":2,"verse_start":1,"verse_end":25}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-03-disobedience'),
  'Disobedience of People',
  'Passage:
Genesis 3',
  'Genesis', 3, 1, 24,
  'Creation to Christ Series', 2, 'ctc-dg-03-disobedience',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Genesis","chapter":3,"verse_start":1,"verse_end":24}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-04-noah-flood'),
  'Noah and the Flood',
  'Passage:
Genesis 6:5–8:14',
  'Genesis', 6, 5, 22,
  'Creation to Christ Series', 3, 'ctc-dg-04-noah-flood',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Genesis","chapter":6,"verse_start":5,"verse_end":22},{"book":"Genesis","chapter":7,"verse_start":1,"verse_end":24},{"book":"Genesis","chapter":8,"verse_start":1,"verse_end":14}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-05-promise-noah'),
  'God’s Promise with Noah',
  'Passage:
Genesis 8:15–9:17',
  'Genesis', 8, 15, 22,
  'Creation to Christ Series', 4, 'ctc-dg-05-promise-noah',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Genesis","chapter":8,"verse_start":15,"verse_end":22},{"book":"Genesis","chapter":9,"verse_start":1,"verse_end":17}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-06-abraham'),
  'God Speaks to Abraham',
  'Passage:
Genesis 12:1–7
Genesis 15:1–6',
  'Genesis', 12, 1, 7,
  'Creation to Christ Series', 5, 'ctc-dg-06-abraham',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Genesis","chapter":12,"verse_start":1,"verse_end":7},{"book":"Genesis","chapter":15,"verse_start":1,"verse_end":6}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-07-david-king'),
  'David Becomes King of Abraham’s Descendants',
  'Passage:
1 Samuel 16:1–13
2 Samuel 7:1–28',
  '1 Samuel', 16, 1, 13,
  'Creation to Christ Series', 6, 'ctc-dg-07-david-king',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"1 Samuel","chapter":16,"verse_start":1,"verse_end":13},{"book":"2 Samuel","chapter":7,"verse_start":1,"verse_end":28}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-08-david-bathsheba'),
  'King David and Bathsheba',
  'Passage:
2 Samuel 11:1–27',
  '2 Samuel', 11, 1, 27,
  'Creation to Christ Series', 7, 'ctc-dg-08-david-bathsheba',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"2 Samuel","chapter":11,"verse_start":1,"verse_end":27}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-09-nathan'),
  'Nathan’s Story',
  'Passage:
2 Samuel 12:1–25',
  '2 Samuel', 12, 1, 25,
  'Creation to Christ Series', 8, 'ctc-dg-09-nathan',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"2 Samuel","chapter":12,"verse_start":1,"verse_end":25}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dg-10-savior-promised'),
  'God Promises a Savior Will Come',
  'Passage:
Isaiah 53',
  'Isaiah', 53, 1, 12,
  'Creation to Christ Series', 9, 'ctc-dg-10-savior-promised',
  'Discover God — Who Is God and What Is He Like?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Isaiah","chapter":53,"verse_start":1,"verse_end":12}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-01-savior-born'),
  'Savior Born',
  'Passage:
Matthew 1:18–25',
  'Matthew', 1, 18, 25,
  'Creation to Christ Series', 10, 'ctc-dj-01-savior-born',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Matthew","chapter":1,"verse_start":18,"verse_end":25}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-02-baptism'),
  'Jesus’ Baptism',
  'Passage:
Matthew 3:7–9
Matthew 3:13–15',
  'Matthew', 3, 7, 9,
  'Creation to Christ Series', 11, 'ctc-dj-02-baptism',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Matthew","chapter":3,"verse_start":7,"verse_end":9},{"book":"Matthew","chapter":3,"verse_start":13,"verse_end":15}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-03-crazy-man'),
  'Crazy Man Healed',
  'Passage:
Mark 5:1–20',
  'Mark', 5, 1, 20,
  'Creation to Christ Series', 12, 'ctc-dj-03-crazy-man',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Mark","chapter":5,"verse_start":1,"verse_end":20}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-04-sheep'),
  'Jesus Never Loses Sheep',
  'Passage:
John 10:1–30',
  'John', 10, 1, 30,
  'Creation to Christ Series', 13, 'ctc-dj-04-sheep',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"John","chapter":10,"verse_start":1,"verse_end":30}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-05-blind'),
  'Jesus Heals the Blind',
  'Passage:
Luke 18:31–42',
  'Luke', 18, 31, 42,
  'Creation to Christ Series', 14, 'ctc-dj-05-blind',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":18,"verse_start":31,"verse_end":42}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-06-zacchaeus'),
  'Jesus and Zacchaeus',
  'Passage:
Luke 19:1–9',
  'Luke', 19, 1, 9,
  'Creation to Christ Series', 15, 'ctc-dj-06-zacchaeus',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":19,"verse_start":1,"verse_end":9}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-07-matthew'),
  'Jesus and Matthew',
  'Passage:
Matthew 9:9–13',
  'Matthew', 9, 9, 13,
  'Creation to Christ Series', 16, 'ctc-dj-07-matthew',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Matthew","chapter":9,"verse_start":9,"verse_end":13}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-08-only-way'),
  'Jesus Is the Only Way',
  'Passage:
John 14:1–15',
  'John', 14, 1, 15,
  'Creation to Christ Series', 17, 'ctc-dj-08-only-way',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"John","chapter":14,"verse_start":1,"verse_end":15}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-09-holy-spirit'),
  'Holy Spirit Coming',
  'Passage:
John 16:5–15',
  'John', 16, 5, 15,
  'Creation to Christ Series', 18, 'ctc-dj-09-holy-spirit',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"John","chapter":16,"verse_start":5,"verse_end":15}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-10-last-dinner'),
  'Last Dinner',
  'Passage:
Luke 22:14–20',
  'Luke', 22, 14, 20,
  'Creation to Christ Series', 19, 'ctc-dj-10-last-dinner',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":22,"verse_start":14,"verse_end":20}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-11-arrest-trial'),
  'Arrest and Trial',
  'Passage:
Luke 22:47–53
Luke 23:13–24',
  'Luke', 22, 47, 53,
  'Creation to Christ Series', 20, 'ctc-dj-11-arrest-trial',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":22,"verse_start":47,"verse_end":53},{"book":"Luke","chapter":23,"verse_start":13,"verse_end":24}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-12-execution'),
  'Execution',
  'Passage:
Luke 23:33–56',
  'Luke', 23, 33, 56,
  'Creation to Christ Series', 21, 'ctc-dj-12-execution',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":23,"verse_start":33,"verse_end":56}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-13-alive'),
  'Jesus Is Alive',
  'Passage:
Luke 24:1–7
Luke 24:36–47
Acts 1:1–11',
  'Luke', 24, 1, 7,
  'Creation to Christ Series', 22, 'ctc-dj-13-alive',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":24,"verse_start":1,"verse_end":7},{"book":"Luke","chapter":24,"verse_start":36,"verse_end":47},{"book":"Acts","chapter":1,"verse_start":1,"verse_end":11}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:ctc-dj-14-believing-doing'),
  'Believing and Doing',
  'Passage:
Philippians 3:3–9',
  'Philippians', 3, 3, 9,
  'Creation to Christ Series', 23, 'ctc-dj-14-believing-doing',
  'Discover Jesus — Who Is Jesus and Why Did He Come?',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"Philippians","chapter":3,"verse_start":3,"verse_end":9}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-01-authority'),
  'Jesus Has Authority',
  'Passage:
Mark 4:35–41

Story:
Jesus Calms the Storm',
  'Mark', 4, 35, 41,
  'Hope Series + Commands of Christ', 24, 'hope-01-authority',
  'Hope Series — Discovering the Hope Found in Jesus',
  'Jesus Calms the Storm',
  NULL,
  NULL,
  $json$[{"book":"Mark","chapter":4,"verse_start":35,"verse_end":41}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-02-power-evil'),
  'Jesus Has Power Over Evil',
  'Passage:
Mark 5:1–20

Story:
The Demon-Possessed Man',
  'Mark', 5, 1, 20,
  'Hope Series + Commands of Christ', 25, 'hope-02-power-evil',
  'Hope Series — Discovering the Hope Found in Jesus',
  'The Demon-Possessed Man',
  NULL,
  NULL,
  $json$[{"book":"Mark","chapter":5,"verse_start":1,"verse_end":20}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-03-broken'),
  'Jesus Cares for the Broken',
  'Passage:
Mark 5:21–43

Story:
Jairus’ Daughter & the Bleeding Woman',
  'Mark', 5, 21, 43,
  'Hope Series + Commands of Christ', 26, 'hope-03-broken',
  'Hope Series — Discovering the Hope Found in Jesus',
  'Jairus’ Daughter & the Bleeding Woman',
  NULL,
  NULL,
  $json$[{"book":"Mark","chapter":5,"verse_start":21,"verse_end":43}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-04-provides'),
  'Jesus Provides',
  'Passage:
Mark 6:30–44

Story:
Feeding the Five Thousand',
  'Mark', 6, 30, 44,
  'Hope Series + Commands of Christ', 27, 'hope-04-provides',
  'Hope Series — Discovering the Hope Found in Jesus',
  'Feeding the Five Thousand',
  NULL,
  NULL,
  $json$[{"book":"Mark","chapter":6,"verse_start":30,"verse_end":44}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-05-forgives'),
  'Jesus Forgives Sin',
  'Passage:
Mark 2:1–12

Story:
The Paralytic Lowered Through the Roof',
  'Mark', 2, 1, 12,
  'Hope Series + Commands of Christ', 28, 'hope-05-forgives',
  'Hope Series — Discovering the Hope Found in Jesus',
  'The Paralytic Lowered Through the Roof',
  NULL,
  NULL,
  $json$[{"book":"Mark","chapter":2,"verse_start":1,"verse_end":12}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-06-welcomes'),
  'Jesus Welcomes Sinners',
  'Passage:
Luke 19:1–10

Story:
Zacchaeus',
  'Luke', 19, 1, 10,
  'Hope Series + Commands of Christ', 29, 'hope-06-welcomes',
  'Hope Series — Discovering the Hope Found in Jesus',
  'Zacchaeus',
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":19,"verse_start":1,"verse_end":10}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-07-living-water'),
  'Jesus Gives Living Water',
  'Passage:
John 4:1–42

Story:
The Samaritan Woman at the Well',
  'John', 4, 1, 42,
  'Hope Series + Commands of Christ', 30, 'hope-07-living-water',
  'Hope Series — Discovering the Hope Found in Jesus',
  'The Samaritan Woman at the Well',
  NULL,
  NULL,
  $json$[{"book":"John","chapter":4,"verse_start":1,"verse_end":42}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-08-good-shepherd'),
  'Jesus Is the Good Shepherd',
  'Passage:
John 10:1–18',
  'John', 10, 1, 18,
  'Hope Series + Commands of Christ', 31, 'hope-08-good-shepherd',
  'Hope Series — Discovering the Hope Found in Jesus',
  NULL,
  NULL,
  NULL,
  $json$[{"book":"John","chapter":10,"verse_start":1,"verse_end":18}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-09-raises-dead'),
  'Jesus Raises the Dead',
  'Passage:
John 11:1–44

Story:
Lazarus',
  'John', 11, 1, 44,
  'Hope Series + Commands of Christ', 32, 'hope-09-raises-dead',
  'Hope Series — Discovering the Hope Found in Jesus',
  'Lazarus',
  NULL,
  NULL,
  $json$[{"book":"John","chapter":11,"verse_start":1,"verse_end":44}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-10-loves-lost'),
  'Jesus Loves the Lost',
  'Passage:
Luke 15:11–32

Story:
The Lost Son',
  'Luke', 15, 11, 32,
  'Hope Series + Commands of Christ', 33, 'hope-10-loves-lost',
  'Hope Series — Discovering the Hope Found in Jesus',
  'The Lost Son',
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":15,"verse_start":11,"verse_end":32}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-11-gives-life'),
  'Jesus Gives His Life',
  'Passage:
Luke 23:32–49

Story:
The Crucifixion',
  'Luke', 23, 32, 49,
  'Hope Series + Commands of Christ', 34, 'hope-11-gives-life',
  'Hope Series — Discovering the Hope Found in Jesus',
  'The Crucifixion',
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":23,"verse_start":32,"verse_end":49}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-12-alive'),
  'Jesus Is Alive',
  'Passage:
Luke 24:1–35

Story:
Resurrection & Road to Emmaus',
  'Luke', 24, 1, 35,
  'Hope Series + Commands of Christ', 35, 'hope-12-alive',
  'Hope Series — Discovering the Hope Found in Jesus',
  'Resurrection & Road to Emmaus',
  NULL,
  NULL,
  $json$[{"book":"Luke","chapter":24,"verse_start":1,"verse_end":35}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:hope-13-sends'),
  'Jesus Sends His Followers',
  'Passage:
Matthew 28:16–20

Story:
The Great Commission',
  'Matthew', 28, 16, 20,
  'Hope Series + Commands of Christ', 36, 'hope-13-sends',
  'Hope Series — Discovering the Hope Found in Jesus',
  'The Great Commission',
  NULL,
  NULL,
  $json$[{"book":"Matthew","chapter":28,"verse_start":16,"verse_end":20}]$json$::jsonb,
  ARRAY[]::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-01-repent'),
  'Repent & Believe',
  'Command:
Mark 1:15

Story options:
Luke 19:1–10 (Zacchaeus)
Luke 7:36–50 (The Sinful Woman)

Additional:
Romans 3:23; Romans 6:23; Romans 10:9–10',
  'Mark', 1, 15, 15,
  'Hope Series + Commands of Christ', 37, 'coc-01-repent',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Mark 1:15',
  NULL,
  $json$[{"book":"Mark","chapter":1,"verse_start":15,"verse_end":15}]$json$::jsonb,
  ARRAY['Luke 19:1–10 (Zacchaeus)', 'Luke 7:36–50 (The Sinful Woman)', 'Romans 3:23', 'Romans 6:23', 'Romans 10:9–10']::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-02-baptized'),
  'Be Baptized',
  'Command:
Matthew 28:19

Story:
Acts 8:26–39 (Philip & the Ethiopian Believer)

Additional:
Romans 6:3–4; Matthew 3:13–16; Acts 2:38',
  'Matthew', 28, 19, 19,
  'Hope Series + Commands of Christ', 38, 'coc-02-baptized',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Matthew 28:19',
  'Acts 8:26–39 (Philip & the Ethiopian Believer)',
  $json$[{"book":"Matthew","chapter":28,"verse_start":19,"verse_end":19}]$json$::jsonb,
  ARRAY['Romans 6:3–4', 'Matthew 3:13–16', 'Acts 2:38']::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-03-pray'),
  'Pray',
  'Command:
Matthew 6:9–13

Story:
Matthew 6:5–15 (Jesus Teaches About Prayer)

Additional:
Luke 10:2',
  'Matthew', 6, 9, 13,
  'Hope Series + Commands of Christ', 39, 'coc-03-pray',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Matthew 6:9–13',
  'Matthew 6:5–15 (Jesus Teaches About Prayer)',
  $json$[{"book":"Matthew","chapter":6,"verse_start":9,"verse_end":13}]$json$::jsonb,
  ARRAY['Luke 10:2']::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-04-make-disciples'),
  'Go and Make Disciples',
  'Command:
Matthew 28:19–20

Story:
John 4:4–42 (The Samaritan Woman)

Additional:
Luke 10:1–11',
  'Matthew', 28, 19, 20,
  'Hope Series + Commands of Christ', 40, 'coc-04-make-disciples',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Matthew 28:19–20',
  'John 4:4–42 (The Samaritan Woman)',
  $json$[{"book":"Matthew","chapter":28,"verse_start":19,"verse_end":20}]$json$::jsonb,
  ARRAY['Luke 10:1–11']::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-05-love'),
  'Love',
  'Command:
Matthew 22:37–39

Story:
Luke 10:25–37 (The Good Samaritan)

Additional:
John 15:13; 1 Corinthians 13; John 13:34–35; John 14:15; John 21:17',
  'Matthew', 22, 37, 39,
  'Hope Series + Commands of Christ', 41, 'coc-05-love',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Matthew 22:37–39',
  'Luke 10:25–37 (The Good Samaritan)',
  $json$[{"book":"Matthew","chapter":22,"verse_start":37,"verse_end":39}]$json$::jsonb,
  ARRAY['John 15:13', '1 Corinthians 13', 'John 13:34–35', 'John 14:15', 'John 21:17']::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-06-worship-perseverance'),
  'Worship Through Perseverance',
  'Command:
Matthew 4:10

Story:
Acts 16:25–34 (Paul, Silas & the Philippian Jailer)

Additional:
Ephesians 5:18–21; Colossians 3:16–17; James 1; Luke 8:4–15',
  'Matthew', 4, 10, 10,
  'Hope Series + Commands of Christ', 42, 'coc-06-worship-perseverance',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Matthew 4:10',
  'Acts 16:25–34 (Paul, Silas & the Philippian Jailer)',
  $json$[{"book":"Matthew","chapter":4,"verse_start":10,"verse_end":10}]$json$::jsonb,
  ARRAY['Ephesians 5:18–21', 'Colossians 3:16–17', 'James 1', 'Luke 8:4–15']::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-07-lords-supper'),
  'Lord’s Supper',
  'Command:
Luke 22:19–20

Story:
Luke 22:7–20 (Jesus’ Last Supper)

Additional:
1 Corinthians 11:23–29; Acts 2:42',
  'Luke', 22, 19, 20,
  'Hope Series + Commands of Christ', 43, 'coc-07-lords-supper',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Luke 22:19–20',
  'Luke 22:7–20 (Jesus’ Last Supper)',
  $json$[{"book":"Luke","chapter":22,"verse_start":19,"verse_end":20}]$json$::jsonb,
  ARRAY['1 Corinthians 11:23–29', 'Acts 2:42']::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-08-give'),
  'Give',
  'Command:
Matthew 6:1–4

Story:
Mark 12:41–44 (The Widow’s Offering)

Additional:
2 Corinthians 9:6–7; Acts 4:34–35',
  'Matthew', 6, 1, 4,
  'Hope Series + Commands of Christ', 44, 'coc-08-give',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Matthew 6:1–4',
  'Mark 12:41–44 (The Widow’s Offering)',
  $json$[{"book":"Matthew","chapter":6,"verse_start":1,"verse_end":4}]$json$::jsonb,
  ARRAY['2 Corinthians 9:6–7', 'Acts 4:34–35']::text[],
  false
);

INSERT INTO preset_stories (
  id, title, description, book, chapter, verse_start, verse_end,
  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,
  passage_segments, additional_refs, deprecated
) VALUES (
  uuid_generate_v5('a5000000-0000-5000-8000-000000000001'::uuid, 'preset:coc-09-gather'),
  'Gather',
  'Command:
Hebrews 10:24–25

Story:
Acts 2:36–47 (The First Church)

Additional:
Acts 5:42; Acts 17:5–7; Acts 18:7; Acts 19:9; Acts 20:20; Romans 16:1–5; 1 Corinthians 16:19; Colossians 4:15; Philemon 1:1–2; 1 Corinthians 10:31',
  'Hebrews', 10, 24, 25,
  'Hope Series + Commands of Christ', 45, 'coc-09-gather',
  'Commands of Christ Series — Learning to Obey Jesus',
  NULL,
  'Hebrews 10:24–25',
  'Acts 2:36–47 (The First Church)',
  $json$[{"book":"Hebrews","chapter":10,"verse_start":24,"verse_end":25}]$json$::jsonb,
  ARRAY['Acts 5:42', 'Acts 17:5–7', 'Acts 18:7', 'Acts 19:9', 'Acts 20:20', 'Romans 16:1–5', '1 Corinthians 16:19', 'Colossians 4:15', 'Philemon 1:1–2', '1 Corinthians 10:31']::text[],
  false
);

