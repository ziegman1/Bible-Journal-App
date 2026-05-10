import type { LinearDiscipleshipStepKey } from "@/lib/app-experience-mode/linear-discipleship-path";
import { isLinearDiscipleshipStepKey } from "@/lib/app-experience-mode/linear-discipleship-path";

/**
 * Copy shown after completing a step (query `?from=<stepKey>`), keyed by the step just finished.
 */
export const TRANSITION_MESSAGE_AFTER_STEP: Partial<Record<LinearDiscipleshipStepKey, string>> = {
  lesson_self_feeding:
    "Now you'll begin practicing Self-Feeding in the Word through SOAPS—Scripture, Observation, Application, Prayer, and Share.",
  soaps_1:
    "Because you completed your first SOAPS faithfully, you're now ready to learn Spiritual Breathing—confession, dependence, and the Spirit's filling.",
  lesson_spiritual_breathing:
    "Next you'll practice the same breathing rhythm again in SOAPS, letting the Word and the Spirit shape how you exhale and inhale in real life.",
  soaps_2:
    "Steady practice in SOAPS prepares you for the next lesson: Dual Accountability—living honestly before God and alongside others.",
  lesson_dual_accountability:
    "You're ready for your final Guided SOAPS—living out truth and accountability in a way others can see and follow.",
  soaps_3:
    "You've completed the six-step discipleship path. Your home tools now match this season of Guided Journey—keep walking in obedience.",
};

export function getTransitionMessageAfterStep(stepCompleted: LinearDiscipleshipStepKey): string | null {
  return TRANSITION_MESSAGE_AFTER_STEP[stepCompleted] ?? null;
}

/** Whether `from` is a valid celebration param for the current stored progress. */
export function isCelebrationFromParamValid(
  from: string | undefined,
  completedKeys: readonly string[]
): boolean {
  if (!from || completedKeys.length === 0) return false;
  if (!isLinearDiscipleshipStepKey(from)) return false;
  return completedKeys[completedKeys.length - 1] === from;
}
