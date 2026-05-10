import { SOAPS_TO_LESSON_MIN_DELAY_MS } from "@/lib/guided-journey/soaps-to-lesson-delay";
import { isGuidedJourneyDelayBypassed } from "@/lib/guided-journey/guided-journey-access";

/** Canonical 6-step discipleship sequence (lessons before tools, SOAPS as practice). */
export const LINEAR_DISCIPLESHIP_STEP_KEYS = [
  "lesson_self_feeding",
  "soaps_1",
  "lesson_spiritual_breathing",
  "soaps_2",
  "lesson_dual_accountability",
  "soaps_3",
] as const;

export type LinearDiscipleshipStepKey = (typeof LINEAR_DISCIPLESHIP_STEP_KEYS)[number];

const KEY_SET = new Set<string>(LINEAR_DISCIPLESHIP_STEP_KEYS);

export function isLinearDiscipleshipStepKey(value: unknown): value is LinearDiscipleshipStepKey {
  return typeof value === "string" && KEY_SET.has(value);
}

export type LinearStepKind = "lesson" | "soaps";

export interface LinearDiscipleshipStepDef {
  key: LinearDiscipleshipStepKey;
  kind: LinearStepKind;
  title: string;
  subtitle: string;
}

export const LINEAR_DISCIPLESHIP_STEPS: readonly LinearDiscipleshipStepDef[] = [
  {
    key: "lesson_self_feeding",
    kind: "lesson",
    title: "Self-Feeding in the Word",
    subtitle: "Lesson",
  },
  {
    key: "soaps_1",
    kind: "soaps",
    title: "SOAPS #1",
    subtitle: "Practice",
  },
  {
    key: "lesson_spiritual_breathing",
    kind: "lesson",
    title: "Spiritual Breathing",
    subtitle: "Lesson",
  },
  {
    key: "soaps_2",
    kind: "soaps",
    title: "SOAPS #2",
    subtitle: "Practice",
  },
  {
    key: "lesson_dual_accountability",
    kind: "lesson",
    title: "Dual Accountability",
    subtitle: "Lesson",
  },
  {
    key: "soaps_3",
    kind: "soaps",
    title: "SOAPS #3",
    subtitle: "Practice",
  },
] as const;

export const LINEAR_DISCIPLESHIP_STEP_COUNT = LINEAR_DISCIPLESHIP_STEPS.length;

const SOAPS_STEP_KEYS = ["soaps_1", "soaps_2", "soaps_3"] as const;
export type LinearSoapsJourneyStepKey = (typeof SOAPS_STEP_KEYS)[number];

const SOAPS_STEP_KEY_SET = new Set<string>(SOAPS_STEP_KEYS);

export function isLinearSoapsJourneyStepKey(value: string): value is LinearSoapsJourneyStepKey {
  return SOAPS_STEP_KEY_SET.has(value);
}

export type GuidedJourneyInviteSentVia = "sms" | "email";

/** Someone the user is inviting along; only rows with `sentVia` + `sentAt` count toward journey gates. */
export type GuidedJourneyInvite = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  sentVia: GuidedJourneyInviteSentVia | null;
  sentAt: string | null;
  createdAt: string;
};

export interface LinearDiscipleshipPathV1 {
  version: 1;
  /** After all six steps (or legacy migration), phased journey tools apply. */
  graduated?: boolean;
  completedKeys: string[];
  currentIndex: number;
  /** User-written lesson reflections keyed by step key (e.g. `lesson_self_feeding`). */
  lessonReflections?: Record<string, string>;
  /** Share-via-Text/Email acknowledged on the journey SOAPS step (see soaps-share-completion-policy). */
  linearSoapsShareIntent?: Partial<Record<LinearSoapsJourneyStepKey, boolean>>;
  /** ISO-8601 completion times per step (server); used for SOAPS → lesson pacing. */
  stepCompletedAt?: Partial<Record<LinearDiscipleshipStepKey, string>>;
  /** People the user hopes to walk with in this journey (name + optional how you’ll reach out). */
  invitedPeople?: GuidedJourneyInvite[];
}

export function isLinearDiscipleshipPathGraduated(path: LinearDiscipleshipPathV1 | null): boolean {
  if (!path) return true;
  if (path.graduated === true) return true;
  return path.completedKeys.length >= LINEAR_DISCIPLESHIP_STEP_COUNT;
}

/** Fresh path for new Guided Journey enrollments. */
export function createInitialLinearDiscipleshipPath(): LinearDiscipleshipPathV1 {
  return {
    version: 1,
    completedKeys: [],
    currentIndex: 0,
  };
}

function isSoapsStepFollowedByLesson(soapsKey: LinearDiscipleshipStepKey): boolean {
  const i = LINEAR_DISCIPLESHIP_STEP_KEYS.indexOf(soapsKey);
  if (i < 0 || i >= LINEAR_DISCIPLESHIP_STEPS.length - 1) return false;
  return LINEAR_DISCIPLESHIP_STEPS[i + 1]?.kind === "lesson";
}

/**
 * True when the user has finished a SOAPS step but the formation buffer before the next lesson
 * has not elapsed. No-op for graduated paths and for SOAPS #3 (nothing follows).
 */
export function isSoapsToLessonDelayActive(
  path: LinearDiscipleshipPathV1,
  completedSoapsKey: LinearDiscipleshipStepKey
): boolean {
  if (isGuidedJourneyDelayBypassed()) return false;
  if (path.graduated === true) return false;
  if (!isLinearSoapsJourneyStepKey(completedSoapsKey)) return false;
  if (!isSoapsStepFollowedByLesson(completedSoapsKey)) return false;
  const at = path.stepCompletedAt?.[completedSoapsKey];
  if (!at) return false;
  const t = Date.parse(at);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < SOAPS_TO_LESSON_MIN_DELAY_MS;
}

export function inviteWasSent(i: GuidedJourneyInvite): boolean {
  if (i.sentVia !== "sms" && i.sentVia !== "email") return false;
  if (!i.sentAt || Number.isNaN(Date.parse(i.sentAt))) return false;
  return true;
}

/** Invites where the user opened Text or Email from the journey invite flow (server-recorded handoff). */
export function countSentGuidedJourneyInvites(path: LinearDiscipleshipPathV1): number {
  return (path.invitedPeople ?? []).filter(inviteWasSent).length;
}

/**
 * After SOAPS #1 and the SOAPS→lesson time buffer, the next lesson stays gated until at least one
 * real invite handoff (SMS or email) is recorded.
 */
export function isSpiritualBreathingInviteGatherActive(path: LinearDiscipleshipPathV1): boolean {
  if (path.graduated === true) return false;
  const keys = path.completedKeys;
  if (!keys.includes("soaps_1") || keys.includes("lesson_spiritual_breathing")) return false;
  const last = keys[keys.length - 1];
  if (last === "soaps_1" && isSoapsToLessonDelayActive(path, "soaps_1")) return false;
  return countSentGuidedJourneyInvites(path) < 1;
}

/** User is on the journey SOAPS step in “rest” mode: step saved, waiting for buffer before the next lesson. */
export function isGuidedJourneySoapsRestPeriod(path: LinearDiscipleshipPathV1): boolean {
  if (isLinearDiscipleshipPathGraduated(path)) return false;
  const n = path.completedKeys.length;
  if (n === 0) return false;
  const last = path.completedKeys[n - 1];
  if (typeof last !== "string" || !isLinearDiscipleshipStepKey(last)) return false;
  if (!isLinearSoapsJourneyStepKey(last)) return false;
  return isSoapsToLessonDelayActive(path, last);
}

/** Zero-based index into {@link LINEAR_DISCIPLESHIP_STEPS} for what the user should *see* on /app/journey. */
export function getDisplayLinearStepIndex(path: LinearDiscipleshipPathV1): number {
  if (isLinearDiscipleshipPathGraduated(path)) return LINEAR_DISCIPLESHIP_STEP_COUNT;
  const n = path.completedKeys.length;
  if (n === 0) return 0;
  const last = path.completedKeys[n - 1];
  if (
    typeof last === "string" &&
    isLinearDiscipleshipStepKey(last) &&
    isLinearSoapsJourneyStepKey(last) &&
    isSoapsToLessonDelayActive(path, last)
  ) {
    return n - 1;
  }
  return Math.min(n, LINEAR_DISCIPLESHIP_STEP_COUNT - 1);
}

/**
 * Step whose completion server actions may accept right now (`null` during SOAPS rest buffer).
 */
export function getCompletableLinearStepKey(path: LinearDiscipleshipPathV1): LinearDiscipleshipStepKey | null {
  if (isLinearDiscipleshipPathGraduated(path)) return null;
  const n = path.completedKeys.length;
  if (n >= LINEAR_DISCIPLESHIP_STEP_COUNT) return null;
  if (n > 0) {
    const last = path.completedKeys[n - 1];
    if (
      typeof last === "string" &&
      isLinearDiscipleshipStepKey(last) &&
      isLinearSoapsJourneyStepKey(last) &&
      isSoapsToLessonDelayActive(path, last)
    ) {
      return null;
    }
  }
  const nextKey = LINEAR_DISCIPLESHIP_STEPS[n]?.key ?? null;
  if (!nextKey) return null;
  if (nextKey === "lesson_spiritual_breathing" && isSpiritualBreathingInviteGatherActive(path)) {
    return null;
  }
  return nextKey;
}

function normalizeLinearPath(raw: unknown): LinearDiscipleshipPathV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  const completedKeys = Array.isArray(o.completedKeys)
    ? o.completedKeys.filter((x): x is string => typeof x === "string" && KEY_SET.has(x))
    : [];
  const graduated = o.graduated === true;
  const currentIndex =
    typeof o.currentIndex === "number" && Number.isFinite(o.currentIndex)
      ? Math.max(0, Math.min(LINEAR_DISCIPLESHIP_STEP_COUNT, Math.floor(o.currentIndex)))
      : Math.min(completedKeys.length, LINEAR_DISCIPLESHIP_STEP_COUNT);
  let lessonReflections: Record<string, string> | undefined;
  if (o.lessonReflections && typeof o.lessonReflections === "object") {
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(o.lessonReflections as Record<string, unknown>)) {
      if (KEY_SET.has(k) && typeof v === "string") r[k] = v;
    }
    if (Object.keys(r).length > 0) lessonReflections = r;
  }
  let linearSoapsShareIntent: Partial<Record<LinearSoapsJourneyStepKey, boolean>> | undefined;
  if (o.linearSoapsShareIntent && typeof o.linearSoapsShareIntent === "object") {
    const si: Partial<Record<LinearSoapsJourneyStepKey, boolean>> = {};
    const raw = o.linearSoapsShareIntent as Record<string, unknown>;
    for (const k of SOAPS_STEP_KEYS) {
      if (raw[k] === true) si[k] = true;
    }
    if (Object.keys(si).length > 0) linearSoapsShareIntent = si;
  }
  let stepCompletedAt: Partial<Record<LinearDiscipleshipStepKey, string>> | undefined;
  if (o.stepCompletedAt && typeof o.stepCompletedAt === "object") {
    const sc: Partial<Record<LinearDiscipleshipStepKey, string>> = {};
    const raw = o.stepCompletedAt as Record<string, unknown>;
    for (const k of LINEAR_DISCIPLESHIP_STEP_KEYS) {
      const v = raw[k];
      if (typeof v === "string" && v.length > 0 && !Number.isNaN(Date.parse(v))) {
        sc[k] = v;
      }
    }
    if (Object.keys(sc).length > 0) stepCompletedAt = sc;
  }
  let invitedPeople: GuidedJourneyInvite[] | undefined;
  if (o.invitedPeople && Array.isArray(o.invitedPeople)) {
    const inv: GuidedJourneyInvite[] = [];
    for (const item of o.invitedPeople) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!id || name.length === 0 || name.length > 200) continue;

      let phone =
        typeof r.phone === "string" && r.phone.trim().length > 0 ? r.phone.trim().slice(0, 40) : null;
      let email =
        typeof r.email === "string" && r.email.trim().length > 0 ? r.email.trim().slice(0, 320) : null;

      const legacyCm = r.contactMethod === "text" || r.contactMethod === "email" ? r.contactMethod : null;
      const legacyVal =
        typeof r.contactValue === "string" && r.contactValue.trim().length > 0
          ? r.contactValue.trim().slice(0, 500)
          : null;
      if (!phone && legacyCm === "text" && legacyVal) phone = legacyVal.slice(0, 40);
      if (!email && legacyCm === "email" && legacyVal) email = legacyVal.slice(0, 320);

      const sentVia: GuidedJourneyInviteSentVia | null =
        r.sentVia === "sms" || r.sentVia === "email" ? r.sentVia : null;
      const sentAt =
        typeof r.sentAt === "string" && r.sentAt.length > 0 && !Number.isNaN(Date.parse(r.sentAt))
          ? r.sentAt
          : null;
      const createdAt =
        typeof r.createdAt === "string" && r.createdAt.length > 0 && !Number.isNaN(Date.parse(r.createdAt))
          ? r.createdAt
          : sentAt ?? new Date().toISOString();

      inv.push({
        id,
        name,
        phone,
        email,
        sentVia,
        sentAt,
        createdAt,
      });
    }
    if (inv.length > 0) invitedPeople = inv;
  }
  return {
    version: 1,
    graduated,
    completedKeys,
    currentIndex,
    lessonReflections,
    linearSoapsShareIntent,
    stepCompletedAt,
    invitedPeople,
  };
}

export type LegacyJourneyProgressShape = {
  currentPhase: number;
  currentStepIndex: number;
  completedStepIds: string[];
  unlockedToolIds: string[];
};

/**
 * Users who already progressed the legacy phase model should not be forced through the new linear path.
 */
export function legacyJourneyUserShouldGraduateLinearPath(jp: LegacyJourneyProgressShape): boolean {
  if (jp.currentPhase > 1) return true;
  if (jp.completedStepIds.length > 0) return true;
  if (jp.currentStepIndex > 0) return true;
  const extraTools = jp.unlockedToolIds.filter((t) => t !== "soaps" && t !== "prayer");
  if (extraTools.length > 0) return true;
  return false;
}

export function resolveLinearDiscipleshipPathFromRaw(
  rawProgress: unknown,
  legacy: LegacyJourneyProgressShape
): LinearDiscipleshipPathV1 {
  const o = rawProgress && typeof rawProgress === "object" ? (rawProgress as Record<string, unknown>) : {};
  const fromRaw = normalizeLinearPath(o.linearDiscipleshipPath);
  if (fromRaw) return fromRaw;

  if (legacyJourneyUserShouldGraduateLinearPath(legacy)) {
    return {
      version: 1,
      graduated: true,
      completedKeys: [...LINEAR_DISCIPLESHIP_STEP_KEYS],
      currentIndex: LINEAR_DISCIPLESHIP_STEP_COUNT,
    };
  }

  return createInitialLinearDiscipleshipPath();
}

export function getActiveLinearStep(
  path: LinearDiscipleshipPathV1
): LinearDiscipleshipStepDef | null {
  if (isLinearDiscipleshipPathGraduated(path)) return null;
  const idx = getDisplayLinearStepIndex(path);
  if (idx >= LINEAR_DISCIPLESHIP_STEP_COUNT) return null;
  return LINEAR_DISCIPLESHIP_STEPS[idx] ?? null;
}

/**
 * Step the server will accept for completion right now.
 * Differs from the displayed step while a SOAPS→lesson buffer is active (`null` then).
 */
export function expectedLinearStepKey(
  path: LinearDiscipleshipPathV1
): LinearDiscipleshipStepKey | null {
  return getCompletableLinearStepKey(path);
}

/** Sidebar tool hrefs while the linear path is active (not graduated). */
export function linearDiscipleshipNavHrefs(path: LinearDiscipleshipPathV1): readonly string[] {
  if (isLinearDiscipleshipPathGraduated(path)) return [];
  const step = getActiveLinearStep(path);
  if (!step) return ["/app/journey"];
  if (step.kind === "lesson") return ["/app/journey"];
  return ["/app/journey", "/app/soaps"];
}
