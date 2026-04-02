/**
 * Shared presenter / facilitator progression for 3/3rds meetings (DB + transition logic).
 */

import { getStarterWeekConfig } from "@/lib/groups/starter-track/starter-track-v1-config";
import type { StarterTrackWeekConfig } from "@/lib/groups/starter-track/types";

/** Recurring “five people this week” homework block (weeks 2–8); hidden on the group’s first Starter Track meeting. */
const WEEKLY_EVANGELISM_HOMEWORK_BODY_RE =
  /tell your story and jesus['\u2019]s?\s+story to five people/i;

export function isWeeklyEvangelismHomeworkPracticeBody(body: string): boolean {
  return WEEKLY_EVANGELISM_HOMEWORK_BODY_RE.test(body.trim());
}

export type FacilitatorPracticeSlide =
  | { kind: "text"; heading?: string; body: string }
  | { kind: "image"; src: string; alt: string; caption?: string };

/**
 * Whether to include the recurring weekly “five people” practice slide.
 * First Starter Track meeting for the group (`ordinal === 1`) omits it; meeting 2+ includes it.
 */
export function includeWeeklyEvangelismHomeworkPractice(
  starterTrackWeek: number | null | undefined,
  starterTrackMeetingOrdinal: number | null | undefined
): boolean {
  if (starterTrackWeek == null || starterTrackWeek < 1 || starterTrackWeek > 8) {
    return true;
  }
  if (starterTrackMeetingOrdinal == null) return true;
  return starterTrackMeetingOrdinal > 1;
}

function filterPracticeSectionsForMeeting(
  cfg: StarterTrackWeekConfig,
  includeWeeklyHomework: boolean
) {
  if (includeWeeklyHomework) return cfg.practiceSections;
  return cfg.practiceSections.filter(
    (s) => !isWeeklyEvangelismHomeworkPracticeBody(s.body)
  );
}

/** Participant Look Forward: same practice text blocks as facilitator present view. */
export function starterTrackPracticeSectionsForLiveMeeting(
  starterTrackWeek: number | null | undefined,
  starterTrackMeetingOrdinal: number | null | undefined
): { heading?: string; body: string }[] {
  const w = starterTrackWeek ?? null;
  if (w == null || w < 1 || w > 8) return [];
  const cfg = getStarterWeekConfig(w);
  if (!cfg) return [];
  const includeWeekly = includeWeeklyEvangelismHomeworkPractice(
    w,
    starterTrackMeetingOrdinal
  );
  return filterPracticeSectionsForMeeting(cfg, includeWeekly);
}

/** Practice deck for facilitator present view — must stay in sync with `practiceSlideCountForMeeting`. */
export function buildFacilitatorPracticeSlides(
  starterTrackWeek: number | null | undefined,
  includeWeeklyHomework: boolean
): FacilitatorPracticeSlide[] {
  const w = starterTrackWeek ?? null;
  if (w == null || w < 1 || w > 8) {
    return [
      {
        kind: "text",
        body: "Take time to practice what you studied. In the participant view, the facilitator can assign practice activities (share the story, testimony, gospel, or role-play). Work through practice together as a group.",
      },
    ];
  }
  const starterWeekConfig = getStarterWeekConfig(w);
  if (!starterWeekConfig) {
    return [
      {
        kind: "text",
        body: "Spend time practicing together as a group.",
      },
    ];
  }
  const sections = filterPracticeSectionsForMeeting(
    starterWeekConfig,
    includeWeeklyHomework
  );
  const slides: FacilitatorPracticeSlide[] = sections.map((s) => ({
    kind: "text" as const,
    heading: s.heading,
    body: s.body,
  }));
  if (starterWeekConfig.assetPaths?.metricsDiagram) {
    slides.push({
      kind: "image",
      src: starterWeekConfig.assetPaths.metricsDiagram,
      alt: "Starter Track week 8 — group metrics diagram",
      caption: "Reference: group metrics diagram",
    });
  }
  if (starterWeekConfig.assetPaths?.churchCircleDiagram) {
    slides.push({
      kind: "image",
      src: starterWeekConfig.assetPaths.churchCircleDiagram,
      alt: "Starter Track week 8 — church circle diagram",
      caption: "Reference: church circle diagram",
    });
  }
  return slides.length > 0
    ? slides
    : [
        {
          kind: "text",
          body: "Spend time practicing together as a group.",
        },
      ];
}

export type LookUpPhase =
  | "read"
  | "retell"
  | "like"
  | "difficult"
  | "reread"
  | "people"
  | "god";

export type ForwardSub = "obey" | "practice" | "prayer" | "commissioning";

export interface PresenterState {
  activeThird: 1 | 2 | 3;
  lookBackSlide: number;
  lookUpPhase: LookUpPhase;
  readChunkIndex: number;
  rereadChunkIndex: number;
  forwardSub: ForwardSub;
  practiceSlideIndex: number;
}

/** Row shape from Supabase / server action */
export interface MeetingPresenterStateRow {
  meeting_id: string;
  active_third: number;
  look_back_slide: number;
  look_up_phase: string;
  read_chunk_index: number;
  reread_chunk_index: number;
  forward_sub: string;
  practice_slide_index: number;
  updated_at: string;
  updated_by: string | null;
}

const LOOK_UP_PHASES: LookUpPhase[] = [
  "read",
  "retell",
  "like",
  "difficult",
  "reread",
  "people",
  "god",
];

const FORWARD_SUBS: ForwardSub[] = [
  "obey",
  "practice",
  "prayer",
  "commissioning",
];

function clampLookUpPhase(v: string): LookUpPhase {
  return (LOOK_UP_PHASES.includes(v as LookUpPhase) ? v : "read") as LookUpPhase;
}

function clampForwardSub(v: string): ForwardSub {
  return (FORWARD_SUBS.includes(v as ForwardSub) ? v : "obey") as ForwardSub;
}

export const DEFAULT_PRESENTER_STATE: PresenterState = {
  activeThird: 1,
  lookBackSlide: 0,
  lookUpPhase: "read",
  readChunkIndex: 0,
  rereadChunkIndex: 0,
  forwardSub: "obey",
  practiceSlideIndex: 0,
};

export function rowToPresenterState(
  row: MeetingPresenterStateRow | null | undefined
): PresenterState {
  if (!row) return { ...DEFAULT_PRESENTER_STATE };
  const third = row.active_third;
  const t: 1 | 2 | 3 =
    third === 2 || third === 3 ? third : 1;
  return {
    activeThird: t,
    lookBackSlide: Math.min(2, Math.max(0, row.look_back_slide)),
    lookUpPhase: clampLookUpPhase(row.look_up_phase),
    readChunkIndex: Math.max(0, row.read_chunk_index),
    rereadChunkIndex: Math.max(0, row.reread_chunk_index),
    forwardSub: clampForwardSub(row.forward_sub),
    practiceSlideIndex: Math.max(0, row.practice_slide_index),
  };
}

export function presenterStateToUpsert(
  meetingId: string,
  s: PresenterState,
  updatedBy: string
) {
  return {
    meeting_id: meetingId,
    active_third: s.activeThird,
    look_back_slide: s.lookBackSlide,
    look_up_phase: s.lookUpPhase,
    read_chunk_index: s.readChunkIndex,
    reread_chunk_index: s.rereadChunkIndex,
    forward_sub: s.forwardSub,
    practice_slide_index: s.practiceSlideIndex,
    updated_by: updatedBy,
  };
}

/**
 * Whole passage in one presenter step for read / reread (fewer duplicate “next” taps;
 * long segments scroll on device). Extremely long ranges still split above this size.
 */
export const PRESENTER_READ_VERSES_PER_CHUNK = 500;
export const PRESENTER_REREAD_VERSES_PER_CHUNK = 500;

export function chunkVerses<T extends { verse: number; text: string }>(
  verses: T[],
  size: number
): T[][] {
  if (verses.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < verses.length; i += size) {
    out.push(verses.slice(i, i + size));
  }
  return out;
}

export interface PresenterTransitionCtx {
  hasPassage: boolean;
  readChunkCount: number;
  rereadChunkCount: number;
  practiceSlideCount: number;
}

export function transitionGoToThird(
  s: PresenterState,
  third: 1 | 2 | 3
): PresenterState {
  if (third === 1) {
    return { ...s, activeThird: 1, lookBackSlide: 0 };
  }
  if (third === 2) {
    return {
      ...s,
      activeThird: 2,
      lookUpPhase: "read",
      readChunkIndex: 0,
      rereadChunkIndex: 0,
    };
  }
  return {
    ...s,
    activeThird: 3,
    forwardSub: "obey",
    practiceSlideIndex: 0,
  };
}

export function transitionNext(
  s: PresenterState,
  ctx: PresenterTransitionCtx
): PresenterState | null {
  const readChunks = ctx.readChunkCount;
  const rereadChunks = ctx.rereadChunkCount;
  const practiceSlides = ctx.practiceSlideCount;
  const hasPassage = ctx.hasPassage;

  if (s.activeThird === 1) {
    if (s.lookBackSlide < 2) {
      return { ...s, lookBackSlide: s.lookBackSlide + 1 };
    }
    return transitionGoToThird(s, 2);
  }

  if (s.activeThird === 2) {
    if (s.lookUpPhase === "read") {
      if (readChunks === 0) {
        return { ...s, lookUpPhase: "retell", readChunkIndex: 0 };
      }
      if (s.readChunkIndex < readChunks - 1) {
        return { ...s, readChunkIndex: s.readChunkIndex + 1 };
      }
      return { ...s, lookUpPhase: "retell", readChunkIndex: 0 };
    }
    if (s.lookUpPhase === "retell") {
      return { ...s, lookUpPhase: "like" };
    }
    if (s.lookUpPhase === "like") {
      return { ...s, lookUpPhase: "difficult" };
    }
    if (s.lookUpPhase === "difficult") {
      if (!hasPassage) {
        return { ...s, lookUpPhase: "people" };
      }
      return { ...s, lookUpPhase: "reread", rereadChunkIndex: 0 };
    }
    if (s.lookUpPhase === "reread") {
      if (rereadChunks === 0) {
        return { ...s, lookUpPhase: "people" };
      }
      if (s.rereadChunkIndex < rereadChunks - 1) {
        return { ...s, rereadChunkIndex: s.rereadChunkIndex + 1 };
      }
      return { ...s, lookUpPhase: "people", rereadChunkIndex: 0 };
    }
    if (s.lookUpPhase === "people") {
      return { ...s, lookUpPhase: "god" };
    }
    if (s.lookUpPhase === "god") {
      return transitionGoToThird(s, 3);
    }
  }

  if (s.activeThird === 3) {
    if (s.forwardSub === "obey") {
      return { ...s, forwardSub: "practice", practiceSlideIndex: 0 };
    }
    if (s.forwardSub === "practice") {
      if (practiceSlides > 0 && s.practiceSlideIndex < practiceSlides - 1) {
        return { ...s, practiceSlideIndex: s.practiceSlideIndex + 1 };
      }
      return { ...s, forwardSub: "prayer" };
    }
    if (s.forwardSub === "prayer") {
      return { ...s, forwardSub: "commissioning" };
    }
  }

  return null;
}

export function transitionPrev(
  s: PresenterState,
  ctx: PresenterTransitionCtx
): PresenterState | null {
  const readChunks = ctx.readChunkCount;
  const rereadChunks = ctx.rereadChunkCount;
  const practiceSlides = ctx.practiceSlideCount;
  const hasPassage = ctx.hasPassage;

  if (s.activeThird === 1) {
    if (s.lookBackSlide > 0) {
      return { ...s, lookBackSlide: s.lookBackSlide - 1 };
    }
    return null;
  }

  if (s.activeThird === 2) {
    if (s.lookUpPhase === "read") {
      if (readChunks === 0) {
        return { ...transitionGoToThird(s, 1), lookBackSlide: 2 };
      }
      if (s.readChunkIndex > 0) {
        return { ...s, readChunkIndex: s.readChunkIndex - 1 };
      }
      return { ...transitionGoToThird(s, 1), lookBackSlide: 2 };
    }
    if (s.lookUpPhase === "retell") {
      if (readChunks === 0) {
        return { ...s, lookUpPhase: "read", readChunkIndex: 0 };
      }
      return { ...s, lookUpPhase: "read", readChunkIndex: readChunks - 1 };
    }
    if (s.lookUpPhase === "like") {
      return { ...s, lookUpPhase: "retell" };
    }
    if (s.lookUpPhase === "difficult") {
      return { ...s, lookUpPhase: "like" };
    }
    if (s.lookUpPhase === "reread") {
      if (s.rereadChunkIndex > 0) {
        return { ...s, rereadChunkIndex: s.rereadChunkIndex - 1 };
      }
      return { ...s, lookUpPhase: "difficult" };
    }
    if (s.lookUpPhase === "people") {
      if (!hasPassage) {
        return { ...s, lookUpPhase: "difficult" };
      }
      if (rereadChunks === 0) {
        return { ...s, lookUpPhase: "difficult" };
      }
      return {
        ...s,
        lookUpPhase: "reread",
        rereadChunkIndex: rereadChunks - 1,
      };
    }
    if (s.lookUpPhase === "god") {
      return { ...s, lookUpPhase: "people" };
    }
  }

  if (s.activeThird === 3) {
    if (s.forwardSub === "commissioning") {
      return { ...s, forwardSub: "prayer" };
    }
    if (s.forwardSub === "prayer") {
      if (practiceSlides > 0) {
        return {
          ...s,
          forwardSub: "practice",
          practiceSlideIndex: practiceSlides - 1,
        };
      }
      return { ...s, forwardSub: "obey" };
    }
    if (s.forwardSub === "practice") {
      if (s.practiceSlideIndex > 0) {
        return { ...s, practiceSlideIndex: s.practiceSlideIndex - 1 };
      }
      return { ...s, forwardSub: "obey" };
    }
    if (s.forwardSub === "obey") {
      return {
        ...s,
        activeThird: 2,
        lookUpPhase: "god",
        readChunkIndex: 0,
        rereadChunkIndex: 0,
      };
    }
  }

  return null;
}

/** Maps participant UI step id to presenter look-up phase. */
export function participantStepToLookUpPhase(
  step: ParticipantLookUpStep
): LookUpPhase {
  if (step === "reread_passage") return "reread";
  return step as LookUpPhase;
}

/**
 * Next step when a participant taps “Next” on their device only (does not write presenter state).
 * After the final Look Up phase (`god`), returns `look_forward` so the UI can open that tab.
 */
export function transitionParticipantLookUpDeviceNext(
  step: ParticipantLookUpStep,
  readChunkIndex: number,
  rereadChunkIndex: number,
  ctx: PresenterTransitionCtx
):
  | {
      kind: "look_up";
      step: ParticipantLookUpStep;
      readChunkIndex: number;
      rereadChunkIndex: number;
    }
  | { kind: "look_forward" }
  | null {
  const s: PresenterState = {
    ...DEFAULT_PRESENTER_STATE,
    activeThird: 2,
    lookUpPhase: participantStepToLookUpPhase(step),
    readChunkIndex,
    rereadChunkIndex,
    forwardSub: "obey",
    practiceSlideIndex: 0,
  };
  const next = transitionNext(s, ctx);
  if (!next) return null;
  if (next.activeThird === 3) return { kind: "look_forward" };
  return {
    kind: "look_up",
    step: lookUpPhaseToParticipantStep(next.lookUpPhase),
    readChunkIndex: next.readChunkIndex,
    rereadChunkIndex: next.rereadChunkIndex,
  };
}

export function presenterCanGoBack(
  s: PresenterState,
  _ctx: PresenterTransitionCtx
): boolean {
  return s.activeThird !== 1 || s.lookBackSlide > 0;
}

/** Participant Look Up UI steps (matches LookUpSection) */
export type ParticipantLookUpStep =
  | "read"
  | "retell"
  | "like"
  | "difficult"
  | "reread_passage"
  | "people"
  | "god";

/** Map DB/facilitator phase to LookUpSection step id */
export function lookUpPhaseToParticipantStep(
  phase: LookUpPhase
): ParticipantLookUpStep {
  if (phase === "reread") return "reread_passage";
  return phase as ParticipantLookUpStep;
}

/** Match facilitator `buildFacilitatorPracticeSlides` length for transition math. */
export function practiceSlideCountForMeeting(
  starterTrackWeek: number | null | undefined,
  starterTrackMeetingOrdinal: number | null | undefined
): number {
  const includeWeekly = includeWeeklyEvangelismHomeworkPractice(
    starterTrackWeek,
    starterTrackMeetingOrdinal
  );
  return Math.max(
    1,
    buildFacilitatorPracticeSlides(starterTrackWeek, includeWeekly).length
  );
}
