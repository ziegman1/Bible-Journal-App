import { cn } from "@/lib/utils";

/** Short multiplication anchors — references only to keep the moment light. */
export const LOOK_BACK_VISION_SCRIPTURE_REFS = [
  "Matthew 28:18–20",
  "Luke 10:2",
  "2 Timothy 2:2",
  "Matthew 4:19",
  "Acts 1:8",
] as const;

export function LookBackVisionEncouragement({
  className,
  compact = false,
}: {
  className?: string;
  /** Tighter list for participant cards vs. presenter. */
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className={cn("text-muted-foreground", compact ? "text-sm leading-relaxed" : "text-sm sm:text-base leading-relaxed")}>
        Healthy groups keep one eye on the harvest: disciples who make disciples. You are not running a program—you
        are joining Jesus in his mission. Let these passages quietly recenter you before you open the Word together.
      </p>
      <ul
        className={cn(
          "list-none space-y-1.5 p-0 m-0 font-medium text-foreground/90",
          compact ? "text-sm" : "text-sm sm:text-base"
        )}
      >
        {LOOK_BACK_VISION_SCRIPTURE_REFS.map((ref) => (
          <li key={ref} className="flex gap-2">
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span>{ref}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
