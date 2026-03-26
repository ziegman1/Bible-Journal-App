import type { StarterTrackWeekConfig } from "./types";

/** Suggested vision verses (shown on intro + vision step). */
export const STARTER_TRACK_VISION_VERSES = [
  "Matthew 28:18–20",
  "Luke 10:1–11",
  "Acts 1:8",
  "Luke 19:1–10",
  "Matthew 13:1–23",
] as const;

export const STARTER_TRACK_V1_WEEKS: StarterTrackWeekConfig[] = [
  {
    week: 1,
    title: "Week 1 — Tell your story",
    shortLabel: "Tell your story",
    primaryPassage: { book: "Mark", chapter: 5, verseStart: 1, verseEnd: 20 },
    additionalLookUpRefs: ["Focus especially on verses 18–20."],
    reminders: [
      "Never skip: check-up (obey / train / share) and vision in Look Back.",
      "Never skip: obey, train, share commitments and practice in Look Forward.",
    ],
    practiceSections: [
      {
        heading: "Practice — tell your story",
        body: `Practice telling your story. Include:
• Life before Jesus
• How you met Jesus
• Life after Jesus
• Invite a response

Keep it under about 3 minutes. Practice with your group.

Choose five people to tell this week. Pray and ask God to show you who those five should be.`,
      },
    ],
  },
  {
    week: 2,
    title: "Week 2 — Tell Jesus’ story",
    shortLabel: "Tell Jesus’ story",
    primaryPassage: { book: "1 Corinthians", chapter: 15, verseStart: 1, verseEnd: 8 },
    additionalLookUpRefs: ["Romans 3:23", "Romans 6:23"],
    reminders: [
      "Keep building the habit of hear → obey → share every week.",
    ],
    practiceSections: [
      {
        heading: "Practice",
        body: "Have everyone practice telling Jesus’ story using the Evangecube or another simple method.",
      },
      {
        body: "Tell your story and Jesus’ story to five people this week — and aim to do this every week.",
      },
    ],
  },
  {
    week: 3,
    title: "Week 3 — Follow & fish",
    shortLabel: "Follow & fish",
    primaryPassage: { book: "Mark", chapter: 1, verseStart: 16, verseEnd: 20 },
    additionalLookUpRefs: [],
    reminders: [
      "Jesus calls disciples to follow him and fish for people — discuss what that looks like for your group.",
    ],
    practiceSections: [
      {
        heading: "Practice",
        body: "Make a list of 100 people you know (family, friends, neighbors, co-workers, classmates) who need to hear about Jesus.",
      },
      {
        body: "Tell your story and Jesus’ story to five people this week. Do this every week.",
      },
    ],
  },
  {
    week: 4,
    title: "Week 4 — Baptism",
    shortLabel: "Baptism",
    primaryPassage: { book: "Romans", chapter: 6, verseStart: 3, verseEnd: 4 },
    additionalLookUpRefs: [
      "Acts 8:26–40",
      "See also: Acts 2:37–41; 8:5–13; 8:36–38; 9:10–19; 10:47–48; 16:13–15; 16:27–34; 18:5–9; 1 Corinthians 1:10–17; Acts 19:1–5; Acts 22:14–17.",
    ],
    reminders: [
      "Baptism follows belief — practice so you’re ready to baptize new believers promptly.",
    ],
    practiceSections: [
      {
        heading: "Practice",
        body: "Practice baptizing each other. In water if you can; otherwise use the back of a chair for support. Example words: ask if they believe Jesus is the Son of God and confess him as Lord; baptize in the name of the Father, Son, and Holy Spirit; have them hold their nose, lower and raise gently, picturing death, burial, and resurrection.",
      },
      {
        body: "Continue to baptize people as soon as they become believers.",
      },
      {
        body: "Tell your story and Jesus’ story to five people this week. Do this every week.",
      },
    ],
  },
  {
    week: 5,
    title: "Week 5 — The Bible",
    shortLabel: "The Bible",
    primaryPassage: { book: "2 Timothy", chapter: 3, verseStart: 14, verseEnd: 16 },
    additionalLookUpRefs: [],
    reminders: [
      "Memorize the seven discovery questions from the simple meeting format (Look Up).",
    ],
    practiceSections: [
      {
        heading: "Practice",
        body: "Memorize and recite the seven Bible study questions (questions 1–7 in the simple meeting format: what you like, what is difficult, teaches about people, teaches about God, then Look Forward commitments and practice).",
      },
      {
        body: "Tell your story and Jesus’ story to five people this week. Do this every week.",
      },
    ],
  },
  {
    week: 6,
    title: "Week 6 — Talk with God",
    shortLabel: "Talk with God",
    primaryPassage: { book: "Matthew", chapter: 6, verseStart: 9, verseEnd: 13 },
    additionalLookUpRefs: [],
    reminders: [
      "Use simple, brief prayer as a group throughout the meeting.",
    ],
    practiceSections: [
      {
        heading: "Practice — hand prayer (Lord’s Prayer)",
        body: "Teach using your hand: (1) Palm — relationship: “Our Father in heaven…” (2) Thumb — worship: “…may your name be holy.” (3) First finger — surrender: “May your kingdom come…” (4) Middle finger — ask: “Give us this day our daily bread.” (5) Fourth finger — forgive. (6) Little finger — protect from temptation. (7) Thumb again — worship: “Yours is the kingdom…”",
      },
      {
        body: "Tell your story and Jesus’ story to five people this week. Do this every week.",
      },
    ],
  },
  {
    week: 7,
    title: "Week 7 — Hard times",
    shortLabel: "Hard times",
    primaryPassage: { book: "Acts", chapter: 5, verseStart: 17, verseEnd: 42 },
    additionalLookUpRefs: ["Matthew 5:43–44"],
    reminders: [
      "Pray honestly for courage and love when faith is costly.",
    ],
    practiceSections: [
      {
        heading: "Practice",
        body: "Share with the group a difficulty you have faced because of your new faith. Consider difficulties you may face. Role-play responding with boldness and love as Jesus teaches. Pray as needs come up; pray for each person after they share.",
      },
      {
        body: "Tell your story and Jesus’ story to five people this week. Do this every week.",
      },
    ],
  },
  {
    week: 8,
    title: "Week 8 — Become a church",
    shortLabel: "Become a church",
    primaryPassage: { book: "Acts", chapter: 2, verseStart: 42, verseEnd: 47 },
    additionalLookUpRefs: ["1 Corinthians 11:23–34"],
    reminders: [
      "A healthy church practices Word, fellowship, breaking bread, prayer, giving, and mission — not only when an outsider visits.",
    ],
    practiceSections: [
      {
        heading: "Practice — group exercise",
        body: "Discuss what your group needs to do to become like the church in these passages.",
      },
      {
        heading: "Draw your group’s circle",
        body: "As a group, draw a dotted-line circle for your group. Above it, record three numbers: how many regularly attend (stick figure), how many believe in Jesus (cross), how many baptized after believing (water). Use the diagram below as a reference.",
      },
      {
        heading: "",
        body: "If your group has committed to be a church, make the dotted circle solid. If you regularly practice each element below, draw the symbol inside the circle; if you don’t practice it or depend on an outsider, draw it outside.",
      },
      {
        heading: "Elements",
        body: "1) Commitment to be a church (solid line). 2) Baptism — water. 3) Bible — book. 4) Remember Jesus (bread & cup) — cup. 5) Fellowship — heart. 6) Giving & ministry — $. 7) Prayer — praying hands. 8) Praise — raised hands. 9) Telling people about Jesus — two figures. 10) Leaders — two faces.",
      },
      {
        heading: "Reflect",
        body: "Ask: “What is our group missing that would help make it a healthy church?”",
      },
      {
        body: "Tell your story and Jesus’ story to five people this week. Do this every week.",
      },
    ],
    assetPaths: {
      metricsDiagram: "/groups/starter-track/week8-metrics.png",
      churchCircleDiagram: "/groups/starter-track/week8-church-circle.png",
    },
  },
];

export function getStarterWeekConfig(
  week: number
): StarterTrackWeekConfig | undefined {
  return STARTER_TRACK_V1_WEEKS.find((w) => w.week === week);
}
