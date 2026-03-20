/** Slug for the v1 eight-week onboarding curriculum. */
export const STARTER_TRACK_V1_SLUG = "starter_v1" as const;

export type StarterTrackWeekNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface StarterTrackWeekPassage {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export interface StarterTrackWeekConfig {
  week: StarterTrackWeekNumber;
  title: string;
  /** Shown in meeting title / lists */
  shortLabel: string;
  /** Primary passage loaded into the normal meeting Look Up flow */
  primaryPassage: StarterTrackWeekPassage;
  /** Extra references shown on the week guide page only */
  additionalLookUpRefs: string[];
  /** Short reminders (never-skips, rhythm) */
  reminders: string[];
  /** Practice / homework — rendered as paragraphs */
  practiceSections: { heading?: string; body: string }[];
  /** Public paths under /public for Week 8 diagrams */
  assetPaths?: { metricsDiagram?: string; churchCircleDiagram?: string };
}

export interface StarterTrackEnrollmentRow {
  id: string;
  group_id: string;
  track_slug: string;
  intro_completed_at: string | null;
  vision_statement: string | null;
  vision_completed_at: string | null;
  weeks_completed: number;
  created_at: string;
  updated_at: string;
}
