export type PrayerWheelStep = {
  index: number;
  /** Short label on the wheel */
  label: string;
  /** Heading in the session panel */
  title: string;
  description: string;
  reference: string;
};

/**
 * Twelve Prayer Wheel segments (MetaCamp Module 1 order, clockwise from top).
 */
export const PRAYER_WHEEL_STEPS: readonly PrayerWheelStep[] = [
  {
    index: 0,
    label: "PRAISE",
    title: "Praise",
    description:
      "Praise the Lord for what is on your mind, special things from the past week, and His goodness to your family.",
    reference: "Psalm 34:1",
  },
  {
    index: 1,
    label: "WAITING",
    title: "Waiting",
    description:
      "Wait on the Lord and let Him pull together reflections. Think about the time ahead and what you want Him to do.",
    reference: "Psalm 27:14",
  },
  {
    index: 2,
    label: "CONFESSION",
    title: "Confession",
    description:
      "Ask the Holy Spirit to show anything displeasing to Him. Confess and claim 1 John 1:9 for cleansing.",
    reference: "Psalm 51:1-19",
  },
  {
    index: 3,
    label: "READ WORD",
    title: "Read the Word",
    description:
      "Read promises of God in Psalms, the prophets, and New Testament passages on prayer.",
    reference: "Psalm 119:97",
  },
  {
    index: 4,
    label: "PETITION",
    title: "Petition",
    description:
      "Bring general requests—for others from prayer lists, and personal needs for yourself and others.",
    reference: "Hebrews 4:16",
  },
  {
    index: 5,
    label: "INTERCESSION",
    title: "Intercession",
    description: "Pray specifically on behalf of others for requests you are aware of.",
    reference: "Romans 15:30-33",
  },
  {
    index: 6,
    label: "PRAY WORD",
    title: "Pray the Word",
    description: "Take Scriptures (such as from Psalm 119) and pray them back to God.",
    reference: "Psalm 119:38-46",
  },
  {
    index: 7,
    label: "THANKS",
    title: "Thanksgiving",
    description: "Give thanks for your life, the church, and your family.",
    reference: "Philippians 4:6",
  },
  {
    index: 8,
    label: "SINGING",
    title: "Singing",
    description: "Sing a prayer song, praise song, or song about witnessing.",
    reference: "Psalm 59:17",
  },
  {
    index: 9,
    label: "MEDITATE",
    title: "Meditate",
    description:
      "Ask the Lord to speak to you; keep paper and pen ready to record impressions.",
    reference: "Psalm 63",
  },
  {
    index: 10,
    label: "LISTEN",
    title: "Listen",
    description:
      "Merge what you have read, prayed, thanked, and sung—see how the Lord brings them together to speak to you.",
    reference: "1 Samuel 3:9-10",
  },
  {
    index: 11,
    label: "END PRAISE",
    title: "End with praise",
    description:
      "Praise the Lord for the time spent, the impressions given, and the requests He raised in your mind.",
    reference: "Psalm 145:1-13",
  },
] as const;

export const PRAYER_WHEEL_STEP_COUNT = PRAYER_WHEEL_STEPS.length;

/** HSL colors for wheel wedges (readable with white labels in light and dark UIs). */
export function prayerWheelWedgeColor(stepIndex: number): string {
  const hue = (stepIndex * 360) / PRAYER_WHEEL_STEP_COUNT;
  return `hsl(${hue} 58% 46%)`;
}
