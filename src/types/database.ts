import type { GrowthMode } from "@/lib/growth-mode/types";

export type ReadingMode = "canonical" | "chronological" | "custom" | "free_reading";
export type AIStyle = "concise" | "balanced" | "in-depth";
export type { GrowthMode };

export interface Profile {
  id: string;
  display_name: string;
  reading_mode: ReadingMode;
  journal_year: number;
  ai_style: AIStyle;
  growth_mode: GrowthMode;
  weekly_share_goal_encounters: number;
  weekly_prayer_goal_minutes: number;
  /** Count adjustments for BADWR reproduction cumulative math (optional). */
  badwr_reproduction_count_adjustments?: Record<string, unknown> | null;
  /** First calendar day counted toward practice metrics after “reset metrics”; null = use account signup. */
  practice_metrics_anchor_ymd?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  reference: string;
  read_at: string;
  created_at: string;
}

export interface AIResponse {
  id: string;
  user_id: string;
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  reference: string;
  question: string;
  response_json: AIResponseJSON;
  raw_text: string | null;
  model: string;
  created_at: string;
}

export interface AIResponseJSON {
  summary: string;
  context: string;
  meaning: string;
  themes: string[];
  crossReferences: { reference: string; note: string }[];
  reflectionPrompt: string;
  applicationInsight: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  year: number;
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  reference: string;
  title: string | null;
  user_question: string | null;
  /** SOAPS: verbatim Scripture */
  scripture_text: string | null;
  user_reflection: string | null;
  prayer: string | null;
  application: string | null;
  /** SOAPS: Share */
  soaps_share: string | null;
  ai_response_id: string | null;
  highlight_color: string | null;
  created_at: string;
  updated_at: string;
  ai_response?: AIResponse | null;
  tags?: Tag[];
}

export interface JournalEntryTag {
  id: string;
  entry_id: string;
  tag_id: string;
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  created_at: string;
}

export interface FavoritePassage {
  id: string;
  user_id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  reference: string;
  created_at: string;
}

export interface StudyThread {
  id: string;
  user_id: string;
  reference: string;
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  title: string | null;
  created_at: string;
}

export interface ThreadMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  structured_ai_response: AIResponseJSON | Record<string, unknown> | null;
  created_at: string;
}

export interface AiUsage {
  user_id: string;
  usage_date: string;
  request_count: number;
  created_at: string;
  updated_at: string;
}
