/** Date range preset for insights */
export type InsightsDateRange =
  | "last30"
  | "last90"
  | "thisYear"
  | "allTime"
  | "custom";

/** Parsed date range for queries */
export interface InsightsDateBounds {
  start: string; // ISO date
  end: string;   // ISO date
}

/** Top tag with count */
export interface TagCount {
  name: string;
  slug: string;
  count: number;
}

/** Book with count (entries, sessions, or threads) */
export interface BookCount {
  book: string;
  count: number;
}

/** Passage reference with revisit count */
export interface PassageRevisit {
  reference: string;
  book: string;
  chapter: number;
  count: number;
}

/** Journaling frequency bucket (by week or month) */
export interface FrequencyBucket {
  label: string;  // e.g. "2024-01" or "Week of Jan 1"
  count: number;
}

/** Keyword with count (from reflections, prayers, applications) */
export interface KeywordCount {
  word: string;
  count: number;
}

/** Full insights summary payload */
export interface InsightsSummary {
  dateRange: InsightsDateBounds;
  overview: {
    totalJournalEntries: number;
    totalStudyThreads: number;
    totalAIQuestions: number;
    booksStudied: string[];
    booksStudiedCount: number;
  };
  themesAndTags: {
    topTags: TagCount[];
  };
  booksAndPassages: {
    topBooks: BookCount[];
    passagesMostRevisited: PassageRevisit[];
    topBooksReferenced: BookCount[];
    topChaptersReferenced: { book: string; chapter: number; count: number }[];
  };
  journalingActivity: {
    frequencyByMonth: FrequencyBucket[];
    frequencyByWeek: FrequencyBucket[];
  };
  repeatedWords: {
    topKeywords: KeywordCount[];
  };
  /** Samples for AI synthesis (reflections, prayers, applications, thread insights) */
  samplesForAI?: {
    reflections: string[];
    prayers: string[];
    applications: string[];
    threadInsights: string[];
  };
}

/** AI-generated insight summary (structured JSON from OpenAI) */
export interface InsightSummaryJSON {
  headline: string;
  recurringThemes: string[];
  keyLearnings: string[];
  prayerPatterns: string;
  applicationPatterns: string;
  spiritualTrajectory: string;
  encouragement: string;
}
