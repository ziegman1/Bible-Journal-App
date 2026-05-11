/**
 * Generates supabase/migrations/080_preset_series_catalog.sql from embedded catalog.
 * Run: node scripts/build-preset-series-migration.cjs
 */
const fs = require("fs");
const path = require("path");

const NS = "a5000000-0000-5000-8000-000000000001";

/** @typedef {{ book: string; chapter: number; verse_start: number; verse_end: number }} Seg */

/** @type {{ slug: string; title: string; seriesName: string; seriesOrder: number; phaseTitle: string; description: string; primary: Seg; segments: Seg[]; storySubtitle?: string | null; commandRef?: string | null; storyRef?: string | null; additionalRefs?: string[] }}[] */
const LESSONS = [];

function add(o) {
  LESSONS.push({
    storySubtitle: null,
    commandRef: null,
    storyRef: null,
    additionalRefs: [],
    ...o,
    segments: o.segments?.length ? o.segments : [o.primary],
  });
}

const DG = "Discover God — Who Is God and What Is He Like?";
const DJ = "Discover Jesus — Who Is Jesus and Why Did He Come?";
const S1 = "Creation to Christ Series";
const S2 = "Hope Series + Commands of Christ";
const P2A = "Hope Series — Discovering the Hope Found in Jesus";
const P2B = "Commands of Christ Series — Learning to Obey Jesus";

let ord = 0;
// --- Series 1 Discover God
add({ slug: "ctc-dg-01-creation", title: "Creation", seriesName: S1, seriesOrder: ord++, phaseTitle: DG, description: "Passage:\nGenesis 1", primary: { book: "Genesis", chapter: 1, verse_start: 1, verse_end: 31 } });
add({ slug: "ctc-dg-02-creation-of-people", title: "Creation of People", seriesName: S1, seriesOrder: ord++, phaseTitle: DG, description: "Passage:\nGenesis 2", primary: { book: "Genesis", chapter: 2, verse_start: 1, verse_end: 25 } });
add({ slug: "ctc-dg-03-disobedience", title: "Disobedience of People", seriesName: S1, seriesOrder: ord++, phaseTitle: DG, description: "Passage:\nGenesis 3", primary: { book: "Genesis", chapter: 3, verse_start: 1, verse_end: 24 } });
add({
  slug: "ctc-dg-04-noah-flood",
  title: "Noah and the Flood",
  seriesName: S1,
  seriesOrder: ord++,
  phaseTitle: DG,
  description: "Passage:\nGenesis 6:5–8:14",
  primary: { book: "Genesis", chapter: 6, verse_start: 5, verse_end: 22 },
  segments: [
    { book: "Genesis", chapter: 6, verse_start: 5, verse_end: 22 },
    { book: "Genesis", chapter: 7, verse_start: 1, verse_end: 24 },
    { book: "Genesis", chapter: 8, verse_start: 1, verse_end: 14 },
  ],
});
add({
  slug: "ctc-dg-05-promise-noah",
  title: "God’s Promise with Noah",
  seriesName: S1,
  seriesOrder: ord++,
  phaseTitle: DG,
  description: "Passage:\nGenesis 8:15–9:17",
  primary: { book: "Genesis", chapter: 8, verse_start: 15, verse_end: 22 },
  segments: [
    { book: "Genesis", chapter: 8, verse_start: 15, verse_end: 22 },
    { book: "Genesis", chapter: 9, verse_start: 1, verse_end: 17 },
  ],
});
add({
  slug: "ctc-dg-06-abraham",
  title: "God Speaks to Abraham",
  seriesName: S1,
  seriesOrder: ord++,
  phaseTitle: DG,
  description: "Passage:\nGenesis 12:1–7\nGenesis 15:1–6",
  primary: { book: "Genesis", chapter: 12, verse_start: 1, verse_end: 7 },
  segments: [
    { book: "Genesis", chapter: 12, verse_start: 1, verse_end: 7 },
    { book: "Genesis", chapter: 15, verse_start: 1, verse_end: 6 },
  ],
});
add({
  slug: "ctc-dg-07-david-king",
  title: "David Becomes King of Abraham’s Descendants",
  seriesName: S1,
  seriesOrder: ord++,
  phaseTitle: DG,
  description: "Passage:\n1 Samuel 16:1–13\n2 Samuel 7:1–28",
  primary: { book: "1 Samuel", chapter: 16, verse_start: 1, verse_end: 13 },
  segments: [
    { book: "1 Samuel", chapter: 16, verse_start: 1, verse_end: 13 },
    { book: "2 Samuel", chapter: 7, verse_start: 1, verse_end: 28 },
  ],
});
add({ slug: "ctc-dg-08-david-bathsheba", title: "King David and Bathsheba", seriesName: S1, seriesOrder: ord++, phaseTitle: DG, description: "Passage:\n2 Samuel 11:1–27", primary: { book: "2 Samuel", chapter: 11, verse_start: 1, verse_end: 27 } });
add({ slug: "ctc-dg-09-nathan", title: "Nathan’s Story", seriesName: S1, seriesOrder: ord++, phaseTitle: DG, description: "Passage:\n2 Samuel 12:1–25", primary: { book: "2 Samuel", chapter: 12, verse_start: 1, verse_end: 25 } });
add({ slug: "ctc-dg-10-savior-promised", title: "God Promises a Savior Will Come", seriesName: S1, seriesOrder: ord++, phaseTitle: DG, description: "Passage:\nIsaiah 53", primary: { book: "Isaiah", chapter: 53, verse_start: 1, verse_end: 12 } });

// Discover Jesus
add({ slug: "ctc-dj-01-savior-born", title: "Savior Born", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nMatthew 1:18–25", primary: { book: "Matthew", chapter: 1, verse_start: 18, verse_end: 25 } });
add({
  slug: "ctc-dj-02-baptism",
  title: "Jesus’ Baptism",
  seriesName: S1,
  seriesOrder: ord++,
  phaseTitle: DJ,
  description: "Passage:\nMatthew 3:7–9\nMatthew 3:13–15",
  primary: { book: "Matthew", chapter: 3, verse_start: 7, verse_end: 9 },
  segments: [
    { book: "Matthew", chapter: 3, verse_start: 7, verse_end: 9 },
    { book: "Matthew", chapter: 3, verse_start: 13, verse_end: 15 },
  ],
});
add({ slug: "ctc-dj-03-crazy-man", title: "Crazy Man Healed", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nMark 5:1–20", primary: { book: "Mark", chapter: 5, verse_start: 1, verse_end: 20 } });
add({ slug: "ctc-dj-04-sheep", title: "Jesus Never Loses Sheep", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nJohn 10:1–30", primary: { book: "John", chapter: 10, verse_start: 1, verse_end: 30 } });
add({ slug: "ctc-dj-05-blind", title: "Jesus Heals the Blind", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nLuke 18:31–42", primary: { book: "Luke", chapter: 18, verse_start: 31, verse_end: 42 } });
add({ slug: "ctc-dj-06-zacchaeus", title: "Jesus and Zacchaeus", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nLuke 19:1–9", primary: { book: "Luke", chapter: 19, verse_start: 1, verse_end: 9 } });
add({ slug: "ctc-dj-07-matthew", title: "Jesus and Matthew", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nMatthew 9:9–13", primary: { book: "Matthew", chapter: 9, verse_start: 9, verse_end: 13 } });
add({ slug: "ctc-dj-08-only-way", title: "Jesus Is the Only Way", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nJohn 14:1–15", primary: { book: "John", chapter: 14, verse_start: 1, verse_end: 15 } });
add({ slug: "ctc-dj-09-holy-spirit", title: "Holy Spirit Coming", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nJohn 16:5–15", primary: { book: "John", chapter: 16, verse_start: 5, verse_end: 15 } });
add({ slug: "ctc-dj-10-last-dinner", title: "Last Dinner", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nLuke 22:14–20", primary: { book: "Luke", chapter: 22, verse_start: 14, verse_end: 20 } });
add({
  slug: "ctc-dj-11-arrest-trial",
  title: "Arrest and Trial",
  seriesName: S1,
  seriesOrder: ord++,
  phaseTitle: DJ,
  description: "Passage:\nLuke 22:47–53\nLuke 23:13–24",
  primary: { book: "Luke", chapter: 22, verse_start: 47, verse_end: 53 },
  segments: [
    { book: "Luke", chapter: 22, verse_start: 47, verse_end: 53 },
    { book: "Luke", chapter: 23, verse_start: 13, verse_end: 24 },
  ],
});
add({ slug: "ctc-dj-12-execution", title: "Execution", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nLuke 23:33–56", primary: { book: "Luke", chapter: 23, verse_start: 33, verse_end: 56 } });
add({
  slug: "ctc-dj-13-alive",
  title: "Jesus Is Alive",
  seriesName: S1,
  seriesOrder: ord++,
  phaseTitle: DJ,
  description: "Passage:\nLuke 24:1–7\nLuke 24:36–47\nActs 1:1–11",
  primary: { book: "Luke", chapter: 24, verse_start: 1, verse_end: 7 },
  segments: [
    { book: "Luke", chapter: 24, verse_start: 1, verse_end: 7 },
    { book: "Luke", chapter: 24, verse_start: 36, verse_end: 47 },
    { book: "Acts", chapter: 1, verse_start: 1, verse_end: 11 },
  ],
});
add({ slug: "ctc-dj-14-believing-doing", title: "Believing and Doing", seriesName: S1, seriesOrder: ord++, phaseTitle: DJ, description: "Passage:\nPhilippians 3:3–9", primary: { book: "Philippians", chapter: 3, verse_start: 3, verse_end: 9 } });

// Hope series
function hope(slug, title, storySubtitle, desc, primary, segments) {
  add({
    slug,
    title,
    seriesName: S2,
    seriesOrder: ord++,
    phaseTitle: P2A,
    storySubtitle,
    description: desc,
    primary,
    segments: segments || [primary],
  });
}
hope("hope-01-authority", "Jesus Has Authority", "Jesus Calms the Storm", "Passage:\nMark 4:35–41\n\nStory:\nJesus Calms the Storm", { book: "Mark", chapter: 4, verse_start: 35, verse_end: 41 });
hope("hope-02-power-evil", "Jesus Has Power Over Evil", "The Demon-Possessed Man", "Passage:\nMark 5:1–20\n\nStory:\nThe Demon-Possessed Man", { book: "Mark", chapter: 5, verse_start: 1, verse_end: 20 });
hope("hope-03-broken", "Jesus Cares for the Broken", "Jairus’ Daughter & the Bleeding Woman", "Passage:\nMark 5:21–43\n\nStory:\nJairus’ Daughter & the Bleeding Woman", { book: "Mark", chapter: 5, verse_start: 21, verse_end: 43 });
hope("hope-04-provides", "Jesus Provides", "Feeding the Five Thousand", "Passage:\nMark 6:30–44\n\nStory:\nFeeding the Five Thousand", { book: "Mark", chapter: 6, verse_start: 30, verse_end: 44 });
hope("hope-05-forgives", "Jesus Forgives Sin", "The Paralytic Lowered Through the Roof", "Passage:\nMark 2:1–12\n\nStory:\nThe Paralytic Lowered Through the Roof", { book: "Mark", chapter: 2, verse_start: 1, verse_end: 12 });
hope("hope-06-welcomes", "Jesus Welcomes Sinners", "Zacchaeus", "Passage:\nLuke 19:1–10\n\nStory:\nZacchaeus", { book: "Luke", chapter: 19, verse_start: 1, verse_end: 10 });
hope("hope-07-living-water", "Jesus Gives Living Water", "The Samaritan Woman at the Well", "Passage:\nJohn 4:1–42\n\nStory:\nThe Samaritan Woman at the Well", { book: "John", chapter: 4, verse_start: 1, verse_end: 42 });
hope("hope-08-good-shepherd", "Jesus Is the Good Shepherd", null, "Passage:\nJohn 10:1–18", { book: "John", chapter: 10, verse_start: 1, verse_end: 18 });
hope("hope-09-raises-dead", "Jesus Raises the Dead", "Lazarus", "Passage:\nJohn 11:1–44\n\nStory:\nLazarus", { book: "John", chapter: 11, verse_start: 1, verse_end: 44 });
hope("hope-10-loves-lost", "Jesus Loves the Lost", "The Lost Son", "Passage:\nLuke 15:11–32\n\nStory:\nThe Lost Son", { book: "Luke", chapter: 15, verse_start: 11, verse_end: 32 });
hope("hope-11-gives-life", "Jesus Gives His Life", "The Crucifixion", "Passage:\nLuke 23:32–49\n\nStory:\nThe Crucifixion", { book: "Luke", chapter: 23, verse_start: 32, verse_end: 49 });
hope("hope-12-alive", "Jesus Is Alive", "Resurrection & Road to Emmaus", "Passage:\nLuke 24:1–35\n\nStory:\nResurrection & Road to Emmaus", { book: "Luke", chapter: 24, verse_start: 1, verse_end: 35 });
hope("hope-13-sends", "Jesus Sends His Followers", "The Great Commission", "Passage:\nMatthew 28:16–20\n\nStory:\nThe Great Commission", { book: "Matthew", chapter: 28, verse_start: 16, verse_end: 20 });

// Commands of Christ
function cmd(slug, title, description, primary, opts = {}) {
  add({
    slug,
    title,
    seriesName: S2,
    seriesOrder: ord++,
    phaseTitle: P2B,
    description,
    primary,
    segments: opts.segments || [primary],
    commandRef: opts.commandRef || null,
    storyRef: opts.storyRef || null,
    additionalRefs: opts.additionalRefs || [],
  });
}
cmd(
  "coc-01-repent",
  "Repent & Believe",
  "Command:\nMark 1:15\n\nStory options:\nLuke 19:1–10 (Zacchaeus)\nLuke 7:36–50 (The Sinful Woman)\n\nAdditional:\nRomans 3:23; Romans 6:23; Romans 10:9–10",
  { book: "Mark", chapter: 1, verse_start: 15, verse_end: 15 },
  { commandRef: "Mark 1:15", additionalRefs: ["Luke 19:1–10 (Zacchaeus)", "Luke 7:36–50 (The Sinful Woman)", "Romans 3:23", "Romans 6:23", "Romans 10:9–10"] }
);
cmd(
  "coc-02-baptized",
  "Be Baptized",
  "Command:\nMatthew 28:19\n\nStory:\nActs 8:26–39 (Philip & the Ethiopian Believer)\n\nAdditional:\nRomans 6:3–4; Matthew 3:13–16; Acts 2:38",
  { book: "Matthew", chapter: 28, verse_start: 19, verse_end: 19 },
  { commandRef: "Matthew 28:19", storyRef: "Acts 8:26–39 (Philip & the Ethiopian Believer)", additionalRefs: ["Romans 6:3–4", "Matthew 3:13–16", "Acts 2:38"] }
);
cmd(
  "coc-03-pray",
  "Pray",
  "Command:\nMatthew 6:9–13\n\nStory:\nMatthew 6:5–15 (Jesus Teaches About Prayer)\n\nAdditional:\nLuke 10:2",
  { book: "Matthew", chapter: 6, verse_start: 9, verse_end: 13 },
  { commandRef: "Matthew 6:9–13", storyRef: "Matthew 6:5–15 (Jesus Teaches About Prayer)", additionalRefs: ["Luke 10:2"] }
);
cmd(
  "coc-04-make-disciples",
  "Go and Make Disciples",
  "Command:\nMatthew 28:19–20\n\nStory:\nJohn 4:4–42 (The Samaritan Woman)\n\nAdditional:\nLuke 10:1–11",
  { book: "Matthew", chapter: 28, verse_start: 19, verse_end: 20 },
  { commandRef: "Matthew 28:19–20", storyRef: "John 4:4–42 (The Samaritan Woman)", additionalRefs: ["Luke 10:1–11"] }
);
cmd(
  "coc-05-love",
  "Love",
  "Command:\nMatthew 22:37–39\n\nStory:\nLuke 10:25–37 (The Good Samaritan)\n\nAdditional:\nJohn 15:13; 1 Corinthians 13; John 13:34–35; John 14:15; John 21:17",
  { book: "Matthew", chapter: 22, verse_start: 37, verse_end: 39 },
  {
    commandRef: "Matthew 22:37–39",
    storyRef: "Luke 10:25–37 (The Good Samaritan)",
    additionalRefs: ["John 15:13", "1 Corinthians 13", "John 13:34–35", "John 14:15", "John 21:17"],
  }
);
cmd(
  "coc-06-worship-perseverance",
  "Worship Through Perseverance",
  "Command:\nMatthew 4:10\n\nStory:\nActs 16:25–34 (Paul, Silas & the Philippian Jailer)\n\nAdditional:\nEphesians 5:18–21; Colossians 3:16–17; James 1; Luke 8:4–15",
  { book: "Matthew", chapter: 4, verse_start: 10, verse_end: 10 },
  {
    commandRef: "Matthew 4:10",
    storyRef: "Acts 16:25–34 (Paul, Silas & the Philippian Jailer)",
    additionalRefs: ["Ephesians 5:18–21", "Colossians 3:16–17", "James 1", "Luke 8:4–15"],
  }
);
cmd(
  "coc-07-lords-supper",
  "Lord’s Supper",
  "Command:\nLuke 22:19–20\n\nStory:\nLuke 22:7–20 (Jesus’ Last Supper)\n\nAdditional:\n1 Corinthians 11:23–29; Acts 2:42",
  { book: "Luke", chapter: 22, verse_start: 19, verse_end: 20 },
  { commandRef: "Luke 22:19–20", storyRef: "Luke 22:7–20 (Jesus’ Last Supper)", additionalRefs: ["1 Corinthians 11:23–29", "Acts 2:42"] }
);
cmd(
  "coc-08-give",
  "Give",
  "Command:\nMatthew 6:1–4\n\nStory:\nMark 12:41–44 (The Widow’s Offering)\n\nAdditional:\n2 Corinthians 9:6–7; Acts 4:34–35",
  { book: "Matthew", chapter: 6, verse_start: 1, verse_end: 4 },
  { commandRef: "Matthew 6:1–4", storyRef: "Mark 12:41–44 (The Widow’s Offering)", additionalRefs: ["2 Corinthians 9:6–7", "Acts 4:34–35"] }
);
cmd(
  "coc-09-gather",
  "Gather",
  "Command:\nHebrews 10:24–25\n\nStory:\nActs 2:36–47 (The First Church)\n\nAdditional:\nActs 5:42; Acts 17:5–7; Acts 18:7; Acts 19:9; Acts 20:20; Romans 16:1–5; 1 Corinthians 16:19; Colossians 4:15; Philemon 1:1–2; 1 Corinthians 10:31",
  { book: "Hebrews", chapter: 10, verse_start: 24, verse_end: 25 },
  {
    commandRef: "Hebrews 10:24–25",
    storyRef: "Acts 2:36–47 (The First Church)",
    additionalRefs: [
      "Acts 5:42",
      "Acts 17:5–7",
      "Acts 18:7",
      "Acts 19:9",
      "Acts 20:20",
      "Romans 16:1–5",
      "1 Corinthians 16:19",
      "Colossians 4:15",
      "Philemon 1:1–2",
      "1 Corinthians 10:31",
    ],
  }
);

function esc(s) {
  return String(s).replace(/'/g, "''");
}

/** Dollar-quote JSON for safe jsonb casts (segments use double quotes only). */
function segJsonDollar(segs) {
  const j = JSON.stringify(segs);
  return `$json$${j}$json$`;
}

const lines = [];
lines.push(`-- Structured preset series catalog (Creation → Christ; Hope; Commands of Christ)`);
lines.push(`-- Regenerate: node scripts/build-preset-series-migration.cjs`);
lines.push(``);
lines.push(`ALTER TABLE preset_stories`);
lines.push(`  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,`);
lines.push(`  ADD COLUMN IF NOT EXISTS phase_title TEXT,`);
lines.push(`  ADD COLUMN IF NOT EXISTS story_subtitle TEXT,`);
lines.push(`  ADD COLUMN IF NOT EXISTS command_ref TEXT,`);
lines.push(`  ADD COLUMN IF NOT EXISTS story_ref TEXT,`);
lines.push(`  ADD COLUMN IF NOT EXISTS passage_segments JSONB NOT NULL DEFAULT '[]'::jsonb,`);
lines.push(`  ADD COLUMN IF NOT EXISTS additional_refs TEXT[] NOT NULL DEFAULT '{}'::text[],`);
lines.push(`  ADD COLUMN IF NOT EXISTS deprecated BOOLEAN NOT NULL DEFAULT false;`);
lines.push(``);
lines.push(`CREATE INDEX IF NOT EXISTS idx_preset_stories_deprecated ON preset_stories (deprecated) WHERE deprecated = true;`);
lines.push(``);
lines.push(`UPDATE preset_stories SET deprecated = true WHERE slug IS NULL;`);
lines.push(``);

for (const L of LESSONS) {
  const idExpr = `uuid_generate_v5('${NS}'::uuid, 'preset:${esc(L.slug)}')`;
  const add = L.additionalRefs.map((r) => `'${esc(r)}'`).join(", ");
  lines.push(`INSERT INTO preset_stories (`);
  lines.push(`  id, title, description, book, chapter, verse_start, verse_end,`);
  lines.push(`  series_name, series_order, slug, phase_title, story_subtitle, command_ref, story_ref,`);
  lines.push(`  passage_segments, additional_refs, deprecated`);
  lines.push(`) VALUES (`);
  lines.push(`  ${idExpr},`);
  lines.push(`  '${esc(L.title)}',`);
  lines.push(`  '${esc(L.description)}',`);
  lines.push(`  '${esc(L.primary.book)}', ${L.primary.chapter}, ${L.primary.verse_start}, ${L.primary.verse_end},`);
  lines.push(`  '${esc(L.seriesName)}', ${L.seriesOrder}, '${esc(L.slug)}',`);
  lines.push(`  ${L.phaseTitle ? `'${esc(L.phaseTitle)}'` : "NULL"},`);
  lines.push(`  ${L.storySubtitle ? `'${esc(L.storySubtitle)}'` : "NULL"},`);
  lines.push(`  ${L.commandRef ? `'${esc(L.commandRef)}'` : "NULL"},`);
  lines.push(`  ${L.storyRef ? `'${esc(L.storyRef)}'` : "NULL"},`);
  lines.push(`  ${segJsonDollar(L.segments)}::jsonb,`);
  lines.push(`  ARRAY[${add}]::text[],`);
  lines.push(`  false`);
  lines.push(`);`);
  lines.push(``);
}

const out = path.join(__dirname, "../supabase/migrations/080_preset_series_catalog.sql");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log("Wrote", out, "rows", LESSONS.length);
