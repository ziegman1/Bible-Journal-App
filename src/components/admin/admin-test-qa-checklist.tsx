import { cn } from "@/lib/utils";

const DEFAULT_PROMPTS = [
  "Does the page explain what to do?",
  "Is the next step obvious?",
  "Does the user know what was saved (if anything)?",
  "Is there a clear way back?",
  "Does the mobile layout work?",
  "Is the language consistent with the rest of BADWR?",
  "Does this mode match BADWR discipleship philosophy?",
] as const;

export function AdminTestQAChecklist({
  title = "QA prompts",
  prompts = DEFAULT_PROMPTS,
  className,
}: {
  title?: string;
  prompts?: readonly string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/25",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100">{title}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-950/90 dark:text-amber-100/90">
        {prompts.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
