"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isGuidedJourneyToolId, toolsUnlockedThroughPhase } from "@/lib/app-experience-mode/guided-journey";
import {
  countSentGuidedJourneyInvites,
  expectedLinearStepKey,
  isGuidedJourneySoapsRestPeriod,
  isLinearDiscipleshipStepKey,
  isSpiritualBreathingInviteGatherActive,
  LINEAR_DISCIPLESHIP_STEP_COUNT,
  LINEAR_DISCIPLESHIP_STEP_KEYS,
  type GuidedJourneyInvite,
  type LinearDiscipleshipPathV1,
  type LinearDiscipleshipStepKey,
  type LinearSoapsJourneyStepKey,
} from "@/lib/app-experience-mode/linear-discipleship-path";
import { parseJourneyProgress, type JourneyProgressV1 } from "@/lib/app-experience-mode/journey-progress";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import {
  guidedSoapsReadyForComplete,
  guidedSoapsReadyForShare,
  GUIDED_SOAPS_SHARE_GATE_MESSAGE,
  GUIDED_SOAPS_STEP_COMPLETE_GATE_MESSAGE,
  type LatestSoapsFieldsRow,
} from "@/lib/guided-journey/latest-soaps-readiness";
import {
  JOURNEY_DUAL_LESSON_INVITES_REQUIRED,
  JOURNEY_INVITE_GATHER_ONE_LEAD,
  JOURNEY_LESSON_LOCKED_DURING_SOAPS_REST,
  JOURNEY_SHARE_DURING_SOAPS_REST,
  JOURNEY_SOAPS_STEP_ALREADY_COMPLETE,
} from "@/lib/guided-journey/journey-formation-messages";
import { canAccessGuidedJourney } from "@/lib/guided-journey/guided-journey-access";
import type { User } from "@supabase/supabase-js";

const MIN_REFLECTION_LEN = 40;
const MAX_JOURNEY_INVITES = 25;

const LATEST_SOAPS_SELECT =
  "scripture_text, user_reflection, application, prayer, soaps_share" as const;

async function loadLatestSoapsFieldsForUser(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string
): Promise<{ row: LatestSoapsFieldsRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select(LATEST_SOAPS_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { row: null, error: error.message };
  return { row: data as LatestSoapsFieldsRow | null, error: null };
}

function revalidateJourneySurfaces() {
  revalidatePath("/app");
  revalidatePath("/app/journey");
  revalidatePath("/app/journey/invite");
  revalidatePath("/app/settings");
}

function journeyAccessDenied(user: User) {
  return !canAccessGuidedJourney(user);
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

export async function completeLinearLessonStep(input: {
  stepKey: string;
  reflection: string;
  shareConfirmed: boolean;
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (journeyAccessDenied(user)) {
    return { error: "Guided Journey is not available" as const };
  }

  if (!isLinearDiscipleshipStepKey(input.stepKey)) {
    return { error: "Invalid step" as const };
  }
  const stepKey = input.stepKey as LinearDiscipleshipStepKey;
  const reflection = input.reflection.trim();
  if (reflection.length < MIN_REFLECTION_LEN) {
    return {
      error:
        "Please explain the principle in your own words (at least a few sentences) before completing this step." as const,
    };
  }
  if (!input.shareConfirmed) {
    return { error: "Tap Share via Text or Share via Email before completing this step." as const };
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
  if (!path || path.graduated === true || path.completedKeys.length >= LINEAR_DISCIPLESHIP_STEP_COUNT) {
    return { error: "This path is already complete" as const };
  }
  const expected = expectedLinearStepKey(path);
  if (expected !== stepKey) {
    if (expected === null && isGuidedJourneySoapsRestPeriod(path)) {
      return { error: JOURNEY_LESSON_LOCKED_DURING_SOAPS_REST };
    }
    if (
      expected === null &&
      isSpiritualBreathingInviteGatherActive(path) &&
      stepKey === "lesson_spiritual_breathing"
    ) {
      return { error: JOURNEY_INVITE_GATHER_ONE_LEAD };
    }
    return { error: "Complete your current step first" as const };
  }

  if (stepKey === "lesson_dual_accountability" && countSentGuidedJourneyInvites(path) < 3) {
    return { error: JOURNEY_DUAL_LESSON_INVITES_REQUIRED };
  }

  const completedAtIso = new Date().toISOString();
  const nextKeys = [...path.completedKeys, stepKey];
  const reflections = { ...(path.lessonReflections ?? {}), [stepKey]: reflection };
  const stepCompletedAt = { ...path.stepCompletedAt, [stepKey]: completedAtIso };
  const done = nextKeys.length >= LINEAR_DISCIPLESHIP_STEP_COUNT;
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

  const nextJp = done ? graduatePath(jp, nextLinear) : { ...jp, linearDiscipleshipPath: nextLinear };

  const { error } = await supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

export async function recordLinearSoapsShareIntent(stepKey: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (journeyAccessDenied(user)) {
    return { error: "Guided Journey is not available" as const };
  }

  if (stepKey !== "soaps_1" && stepKey !== "soaps_2" && stepKey !== "soaps_3") {
    return { error: "Invalid step" as const };
  }
  const sk = stepKey as LinearSoapsJourneyStepKey;

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
  if (!path || path.graduated === true || path.completedKeys.length >= LINEAR_DISCIPLESHIP_STEP_COUNT) {
    return { error: "This path is not active for this action" as const };
  }
  const expected = expectedLinearStepKey(path);
  if (expected !== sk) {
    if (expected === null && isGuidedJourneySoapsRestPeriod(path)) {
      return { error: JOURNEY_SHARE_DURING_SOAPS_REST };
    }
    return { error: "Open this share action on your current SOAPS step only" as const };
  }

  const { row: latestSoaps, error: soapsErr } = await loadLatestSoapsFieldsForUser(supabase, user.id);
  if (soapsErr) return { error: soapsErr };
  if (!guidedSoapsReadyForShare(latestSoaps)) {
    return { error: GUIDED_SOAPS_SHARE_GATE_MESSAGE };
  }

  const nextLinear: LinearDiscipleshipPathV1 = {
    ...path,
    linearSoapsShareIntent: { ...path.linearSoapsShareIntent, [sk]: true },
  };

  const nextJp = { ...jp, linearDiscipleshipPath: nextLinear };

  const { error } = await supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

export async function completeLinearSoapsStep(stepKey: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (journeyAccessDenied(user)) {
    return { error: "Guided Journey is not available" as const };
  }

  if (stepKey !== "soaps_1" && stepKey !== "soaps_2" && stepKey !== "soaps_3") {
    return { error: "Invalid step" as const };
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
  if (!path || path.graduated === true || path.completedKeys.length >= LINEAR_DISCIPLESHIP_STEP_COUNT) {
    return { error: "This path is already complete" as const };
  }
  if (path.completedKeys.includes(stepKey)) {
    return { error: JOURNEY_SOAPS_STEP_ALREADY_COMPLETE };
  }

  const expected = expectedLinearStepKey(path);
  if (expected !== stepKey) {
    if (expected === null && isGuidedJourneySoapsRestPeriod(path)) {
      return { error: JOURNEY_SOAPS_STEP_ALREADY_COMPLETE };
    }
    return { error: "Complete your current step first" as const };
  }

  const { row: latestSoaps, error: soapsErr } = await loadLatestSoapsFieldsForUser(supabase, user.id);
  if (soapsErr) return { error: soapsErr };
  if (!guidedSoapsReadyForComplete(latestSoaps)) {
    return { error: GUIDED_SOAPS_STEP_COMPLETE_GATE_MESSAGE };
  }

  const completedAtIso = new Date().toISOString();
  const nextKeys = [...path.completedKeys, stepKey];
  const stepCompletedAt = { ...path.stepCompletedAt, [stepKey]: completedAtIso };
  const done = nextKeys.length >= LINEAR_DISCIPLESHIP_STEP_COUNT;
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
        linearSoapsShareIntent: { ...path.linearSoapsShareIntent },
        stepCompletedAt,
        invitedPeople: path.invitedPeople,
      };

  const nextJp = done ? graduatePath(jp, nextLinear) : { ...jp, linearDiscipleshipPath: nextLinear };

  const { error } = await supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

/**
 * Persists one invite row with `sentVia` + `sentAt` immediately before the OS mail/SMS handoff
 * (same pattern as lesson share). Only these rows count toward journey progression gates.
 */
export async function commitGuidedJourneyInviteSend(input: {
  name: string;
  phone?: string;
  email?: string;
  channel: "sms" | "email";
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (journeyAccessDenied(user)) {
    return { error: "Guided Journey is not available" as const };
  }

  const name = input.name.trim();
  if (name.length < 1 || name.length > 200) {
    return { error: "Start with their name—first name or a nickname is enough." as const };
  }
  const phone = (input.phone ?? "").trim().slice(0, 40) || null;
  const email = (input.email ?? "").trim().slice(0, 320) || null;

  if (input.channel === "email") {
    if (!email || !email.includes("@")) {
      return { error: "Add their email so this invite can open in your mail app." as const };
    }
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
  if (!path || path.graduated === true) {
    return { error: "This path is not active for this action" as const };
  }

  const list = [...(path.invitedPeople ?? [])];
  if (list.length >= MAX_JOURNEY_INVITES) {
    return { error: "That's a full list for now—you can remove someone if you need to make room." as const };
  }

  const now = new Date().toISOString();
  const row: GuidedJourneyInvite = {
    id: crypto.randomUUID(),
    name,
    phone,
    email,
    sentVia: input.channel,
    sentAt: now,
    createdAt: now,
  };
  list.push(row);

  const nextLinear: LinearDiscipleshipPathV1 = { ...path, invitedPeople: list };
  const nextJp = { ...jp, linearDiscipleshipPath: nextLinear };

  const { error } = await supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}

export async function removeGuidedJourneyInvite(input: { id: string }) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };
  if (journeyAccessDenied(user)) {
    return { error: "Guided Journey is not available" as const };
  }

  if (typeof input.id !== "string" || input.id.length < 8) {
    return { error: "Invalid entry" as const };
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
  if (!path || path.graduated === true) {
    return { error: "This path is not active for this action" as const };
  }

  const prev = path.invitedPeople ?? [];
  const list = prev.filter((x) => x.id !== input.id);
  if (list.length === prev.length) {
    return { error: "That person was not on your list." as const };
  }

  const nextLinear: LinearDiscipleshipPathV1 = {
    ...path,
    invitedPeople: list.length > 0 ? list : undefined,
  };
  const nextJp = { ...jp, linearDiscipleshipPath: nextLinear };

  const { error } = await supabase
    .from("profiles")
    .update({ journey_progress: nextJp, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidateJourneySurfaces();
  return { success: true as const };
}
