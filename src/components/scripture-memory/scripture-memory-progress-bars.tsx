import { cn } from "@/lib/utils";

export function ScriptureMemoryProgressBars({
  labelA,
  valueA,
  goalA,
  ratioA,
  labelB,
  valueB,
  goalB,
  ratioB,
  compact = false,
}: {
  labelA: string;
  valueA: number;
  goalA: number;
  ratioA: number;
  labelB: string;
  valueB: number;
  goalB: number;
  ratioB: number;
  compact?: boolean;
}) {
  const bar = (ratio: number) => (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        compact ? "h-1.5" : "h-2"
      )}
    >
      <div
        className="h-full rounded-full bg-emerald-500/90 transition-[width] dark:bg-emerald-500/80"
        style={{ width: `${Math.round(Math.min(1, ratio) * 100)}%` }}
      />
    </div>
  );

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <div className="space-y-1">
        <div className="flex justify-between gap-2 text-[11px] text-muted-foreground">
          <span>{labelA}</span>
          <span className="tabular-nums text-foreground">
            {valueA} / {goalA}
          </span>
        </div>
        {bar(ratioA)}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-2 text-[11px] text-muted-foreground">
          <span>{labelB}</span>
          <span className="tabular-nums text-foreground">
            {valueB} / {goalB}
          </span>
        </div>
        {bar(ratioB)}
      </div>
    </div>
  );
}
