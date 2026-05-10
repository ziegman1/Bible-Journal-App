import type { LinearDiscipleshipStepDef } from "@/lib/app-experience-mode/linear-discipleship-path";

export type JourneyStepProgressUi = {
  /** e.g. "Learn the principle" */
  phaseLine: string;
  /** Supporting sentence under the title */
  supportingLine: string;
  /** Step N of 6 (1-based) */
  stepNumber: number;
  totalSteps: number;
};

const TOTAL = 6;

export function journeyStepProgressUi(
  step: LinearDiscipleshipStepDef,
  displayStepZeroBasedIndex: number,
  options?: { soapsRest?: boolean }
): JourneyStepProgressUi {
  const stepNumber = displayStepZeroBasedIndex + 1;
  if (options?.soapsRest && step.kind === "soaps") {
    return {
      stepNumber,
      totalSteps: TOTAL,
      phaseLine: "Space to practice",
      supportingLine:
        "You've completed this SOAPS step. When you're ready, come back here—your next lesson will open on its own after a little time to walk with God in what you've learned.",
    };
  }
  if (step.kind === "lesson") {
    return {
      stepNumber,
      totalSteps: TOTAL,
      phaseLine: "Learn the principle",
      supportingLine:
        "Read slowly, then respond in your own words. Complete this step—including sharing—to continue.",
    };
  }
  return {
    stepNumber,
    totalSteps: TOTAL,
    phaseLine: "Practice it through SOAPS",
    supportingLine:
      "Meet God in Scripture with a full SOAPS entry, then confirm you’ve used the share action on this page before marking complete.",
  };
}
