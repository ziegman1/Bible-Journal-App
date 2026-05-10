"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isGuidedJourneyToolId, toolsUnlockedThroughPhase } from "@/lib/app-experience-mode/guided-journey";
import {
  getCompletableLinearStepKey,
  isLinearDiscipleshipStepKey,
  LINEAR_DISCIPLESHIP_STEP_COUNT,
  LINEAR_DISCIPLESHIP_STEP_KEYS,
  type GuidedJourneyInvite,
  type LinearDiscipleshipPathV1,
  type LinearDiscipleshipStepKey,
  type LinearSoapsJourneyStepKey,
} from "@/lib/app-experience-mode/linear-discipleship-path";
import {
  DEFAULT_JOURNEY_PROGRESS_V1,
  parseJourneyProgress,
  type JourneyProgressV1,
} from "@/lib/app-experience-mode/journey-progress";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { isGuidedJourneyAdminUser } from "@/lib/guided-journey/guided-journey-access";

const ADMIN_REFLECTION =
  "[Admin test] Completed via Guided Journey debug tools for internal QA. This text satisfies minimum length requirements for the data model.";

function revalidateJourneySurfaces() {
  revalidatePath("/app");
  revalidatePath("/app/journey");
  revalidatePath("/app/journey/invite");
  revalidatePath("/app/settings");
}

function mergeGraduatedUnlocked(prev: JourneyProgressV1): string[] {
  const fromPhase = toolsUnlockedThroughPhase(prev.currentPhase);
  const merged = new Set<string>();
  for (const t of fromPhase) {
    if (isGuidedJourneyToolId(t)) merged.add(t);
  }
  for (const t of prev.unlockedToolIds) {
    if (isGuidedJourneyToolId(t)) merged.add(t);
  }
  return [...merged];
}

function graduatePath(prev: JourneyProgressV1, nextLinear: LinearDiscipleshipPathV1): JourneyProgressV1 {
  return {
    ...prev,
    linearDiscipleshipPath: nextLinear,
    unlockedToolIds: mergeGraduatedUnlocked(prev),
  };
}

async function requireAdminJourneyContext() {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (!isGuidedJourneyAdminUser(user)) {
    return { error: "Forbidden" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_experience_mode, journey_progress")
    .eq("id", user.id)
    .maybeSingle();

  if (normalizeAppExperienceMode(profile?.app_experience_mode) !== "journey") {
    return { error: "Guided Journey is not active" as const };
  }

  const jp = parseJourneyProgress(profile?.journey_progress);
  const path = jp.linearDiscipleshipPath;
  if (!path) return { error: "No journey path" as const };

  return { supabase, user, jp, path, profile } as const;
}

export async function resetGuidedJourney(input?: { clearInvites?: boolean }) {
  const ctx = await requireAdminJourneyContext();
  if ("error" in ctx) return ctx;

  const clearInvites = input?.clearInvites !== false;
  const next: JourneyProgressV1 = structuredClone(DEFAULT_JOURNEY_PROGRESS_V1);
  if (!clearInvites && ctx.path.invitedPeople?.length) {
    next.linearDiscipleshipPath = {
      ...next.linearDiscipleshipPath!,
      invitedPeople: ctx.path.invitedPeople,
    };
  }

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ journey_progress: next, updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

export async function setJourneyStep(stepId: string) {
  const ctx = await requireAdminJourneyContext();
  if ("error" in ctx) return ctx;

  if (!isLinearDiscipleshipStepKey(stepId)) {
    return { error: "Invalid step id" as const };
  }
  const target = stepId as LinearDiscipleshipStepKey;
  const idx = LINEAR_DISCIPLESHIP_STEP_KEYS.indexOf(target);
  if (idx < 0) return { error: "Invalid step" as const };

  const completedKeys = LINEAR_DISCIPLESHIP_STEP_KEYS.slice(0, idx) as string[];
  const lessonReflections = { ...(ctx.path.lessonReflections ?? {}) };
  for (const k of Object.keys(lessonReflections)) {
    if (!completedKeys.includes(k)) delete lessonReflections[k];
  }
  const stepCompletedAt = { ...(ctx.path.stepCompletedAt ?? {}) };
  for (const k of Object.keys(stepCompletedAt)) {
    if (!completedKeys.includes(k)) delete stepCompletedAt[k as LinearDiscipleshipStepKey];
  }
  const linearSoapsShareIntent = { ...(ctx.path.linearSoapsShareIntent ?? {}) };
  for (const sk of ["soaps_1", "soaps_2", "soaps_3"] as const) {
    if (!completedKeys.includes(sk)) delete linearSoapsShareIntent[sk];
  }

  const nextLinear: LinearDiscipleshipPathV1 = {
    version: 1,
    graduated: false,
    completedKeys,
    currentIndex: completedKeys.length,
    lessonReflections: Object.keys(lessonReflections).length ? lessonReflections : undefined,
    linearSoapsShareIntent: Object.keys(linearSoapsShareIntent).length ? linearSoapsShareIntent : undefined,
    stepCompletedAt: Object.keys(stepCompletedAt).length ? stepCompletedAt : undefined,
    invitedPeople: ctx.path.invitedPeople,
  };

  const nextJp = { ...ctx.jp, linearDiscipleshipPath: nextLinear };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

export async function adminJourneyGoBackStep() {
  const ctx = await requireAdminJourneyContext();
  if ("error" in ctx) return ctx;
  const path = ctx.path;
  if (path.graduated === true) {
    return { error: "Path is graduated — reset first" as const };
  }
  if (path.completedKeys.length === 0) {
    return { error: "Nothing to undo" as const };
  }

  const removed = path.completedKeys[path.completedKeys.length - 1];
  const nextKeys = path.completedKeys.slice(0, -1);
  const stepCompletedAt = { ...(path.stepCompletedAt ?? {}) };
  if (typeof removed === "string") {
    delete stepCompletedAt[removed as LinearDiscipleshipStepKey];
  }
  const lessonReflections = { ...(path.lessonReflections ?? {}) };
  if (typeof removed === "string") delete lessonReflections[removed];

  const linearSoapsShareIntent = { ...(path.linearSoapsShareIntent ?? {}) };
  if (removed === "soaps_1" || removed === "soaps_2" || removed === "soaps_3") {
    delete linearSoapsShareIntent[removed as LinearSoapsJourneyStepKey];
  }

  const nextLinear: LinearDiscipleshipPathV1 = {
    version: 1,
    completedKeys: nextKeys,
    currentIndex: nextKeys.length,
    lessonReflections: Object.keys(lessonReflections).length ? lessonReflections : undefined,
    linearSoapsShareIntent: Object.keys(linearSoapsShareIntent).length ? linearSoapsShareIntent : undefined,
    stepCompletedAt: Object.keys(stepCompletedAt).length ? stepCompletedAt : undefined,
    invitedPeople: path.invitedPeople,
  };

  const nextJp = { ...ctx.jp, linearDiscipleshipPath: nextLinear };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

function buildNextLinearAfterAdminComplete(
  path: LinearDiscipleshipPathV1,
  stepKey: LinearDiscipleshipStepKey,
  kind: "lesson" | "soaps"
): { nextLinear: LinearDiscipleshipPathV1; done: boolean } {
  const completedAtIso = new Date().toISOString();
  const nextKeys = [...path.completedKeys, stepKey];
  const stepCompletedAt = { ...path.stepCompletedAt, [stepKey]: completedAtIso };
  const done = nextKeys.length >= LINEAR_DISCIPLESHIP_STEP_COUNT;

  if (kind === "lesson") {
    const reflections = { ...(path.lessonReflections ?? {}), [stepKey]: ADMIN_REFLECTION };
    const nextLinear: LinearDiscipleshipPathV1 = done
      ? {
          version: 1,
          graduated: true,
          completedKeys: [...LINEAR_DISCIPLESHIP_STEP_KEYS],
          currentIndex: LINEAR_DISCIPLESHIP_STEP_COUNT,
          lessonReflections: reflections,
          linearSoapsShareIntent: path.linearSoapsShareIntent,
          stepCompletedAt,
          invitedPeople: path.invitedPeople,
        }
      : {
          version: 1,
          completedKeys: nextKeys,
          currentIndex: nextKeys.length,
          lessonReflections: reflections,
          linearSoapsShareIntent: path.linearSoapsShareIntent,
          stepCompletedAt,
          invitedPeople: path.invitedPeople,
        };
    return { nextLinear, done };
  }

  const nextLinear: LinearDiscipleshipPathV1 = done
    ? {
        version: 1,
        graduated: true,
        completedKeys: [...LINEAR_DISCIPLESHIP_STEP_KEYS],
        currentIndex: LINEAR_DISCIPLESHIP_STEP_COUNT,
        lessonReflections: path.lessonReflections,
        linearSoapsShareIntent: path.linearSoapsShareIntent,
        stepCompletedAt,
        invitedPeople: path.invitedPeople,
      }
    : {
        version: 1,
        completedKeys: nextKeys,
        currentIndex: nextKeys.length,
        lessonReflections: path.lessonReflections,
        linearSoapsShareIntent: { ...path.linearSoapsShareIntent, [stepKey as LinearSoapsJourneyStepKey]: true },
        stepCompletedAt,
        invitedPeople: path.invitedPeople,
      };
  return { nextLinear, done };
}

/** Completes the current expectable step without SOAPS / share / reflection gates (admin QA). */
export async function adminJourneyAdvanceExpectableStep() {
  const ctx = await requireAdminJourneyContext();
  if ("error" in ctx) return ctx;
  const path = ctx.path;
  if (path.graduated === true || path.completedKeys.length >= LINEAR_DISCIPLESHIP_STEP_COUNT) {
    return { error: "Path already complete" as const };
  }

  const stepKey = getCompletableLinearStepKey(path);
  if (!stepKey) {
    return { error: "No expectable step (check invite gates or SOAPS delay)" as const };
  }

  const kind = stepKey.startsWith("soaps_") ? "soaps" : "lesson";
  const { nextLinear, done } = buildNextLinearAfterAdminComplete(path, stepKey, kind);
  const nextJp = done ? graduatePath(ctx.jp, nextLinear) : { ...ctx.jp, linearDiscipleshipPath: nextLinear };

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

export async function adminJourneyClearInvites() {
  const ctx = await requireAdminJourneyContext();
  if ("error" in ctx) return ctx;

  const nextLinear: LinearDiscipleshipPathV1 = {
    ...ctx.path,
    invitedPeople: undefined,
  };
  const nextJp = { ...ctx.jp, linearDiscipleshipPath: nextLinear };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

export async function adminJourneySeedSentInvites(count: number) {
  const ctx = await requireAdminJourneyContext();
  if ("error" in ctx) return ctx;
  const n = Math.max(1, Math.min(25, Math.floor(count)));
  const list = [...(ctx.path.invitedPeople ?? [])];
  const now = new Date().toISOString();
  for (let i = 0; i < n; i++) {
    const row: GuidedJourneyInvite = {
      id: crypto.randomUUID(),
      name: `Admin seed ${i + 1}`,
      phone: null,
      email: `journey-admin-seed-${i}@example.invalid`,
      sentVia: "email",
      sentAt: now,
      createdAt: now,
    };
    list.push(row);
  }

  const nextLinear: LinearDiscipleshipPathV1 = { ...ctx.path, invitedPeople: list };
  const nextJp = { ...ctx.jp, linearDiscipleshipPath: nextLinear };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

/** Forces SOAPS timestamps into the past so the next lesson unlocks without env bypass. */
export async function adminJourneySkipSoapsDelay() {
  const ctx = await requireAdminJourneyContext();
  if ("error" in ctx) return ctx;
  const path = ctx.path;
  if (path.graduated === true) return { error: "Path not active" as const };

  const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const stepCompletedAt = { ...(path.stepCompletedAt ?? {}) };
  for (const k of LINEAR_DISCIPLESHIP_STEP_KEYS) {
    if (k.startsWith("soaps_") && stepCompletedAt[k]) {
      stepCompletedAt[k] = old;
    }
  }

  const nextLinear: LinearDiscipleshipPathV1 = { ...path, stepCompletedAt };
  const nextJp = { ...ctx.jp, linearDiscipleshipPath: nextLinear };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", ctx.user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}
