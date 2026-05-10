import type { LinearDiscipleshipStepDef } from "@/lib/app-experience-mode/linear-discipleship-path";
import type { JourneyStepProgressUi } from "@/lib/guided-journey/journey-step-ui";

export function JourneyProgressHeader({
  active,
  progress,
}: {
  active: LinearDiscipleshipStepDef;
  progress: JourneyStepProgressUi;
}) {
  return (
    <header className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-stone-50 to-white p-6 shadow-sm dark:border-stone-800 dark:from-stone-950 dark:to-stone-950/80 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
          Guided discipleship
        </p>
        <p className="text-xs font-medium tabular-nums text-stone-600 dark:text-stone-400">
          Step {progress.stepNumber} of {progress.totalSteps}
        </p>
      </div>
      <p className="mt-2 text-sm font-medium text-sky-900 dark:text-sky-200">{progress.phaseLine}</p>
      <h1 className="mt-2 font-serif text-2xl font-light tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
        {active.title}
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{active.subtitle}</p>
      <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300 border-t border-stone-200/80 pt-4 dark:border-stone-800">
        {progress.supportingLine}
      </p>
    </header>
  );
}
