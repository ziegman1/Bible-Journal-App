import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Primary reading line for scripture text inside the training surface (serif, stable metrics). */
export const SCRIPTURE_READING_TEXT =
  "font-serif text-[17px] leading-[1.85] tracking-[0.01em] text-slate-100/[0.93] [word-break:break-word] [overflow-wrap:anywhere]";

/** Secondary guidance inside the shell (instructions, hints). */
export const SCRIPTURE_TRAINING_META =
  "text-[13px] leading-relaxed text-slate-400/[0.92]";

/** Inputs on dark training surfaces (context, meditation, memorize). */
export const SCRIPTURE_SHELL_FIELD =
  "border-white/10 bg-black/20 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500/30";

/** Step / stage line above the reading area. */
export const SCRIPTURE_TRAINING_STEP =
  "text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500/90";

/**
 * Single shared training environment: centered, deep navy, generous padding.
 * Use for context (step 1), practice (2–5), and typed review so the experience stays one surface.
 */
export function ScriptureTrainingShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[52rem]",
        "rounded-2xl px-6 py-8 sm:px-10 sm:py-10",
        "bg-[#0c1424] bg-gradient-to-b from-[#101a2e]/98 via-[#0c1424] to-[#080e18]",
        "shadow-[0_28px_56px_-16px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.045)]",
        "ring-1 ring-white/[0.07]",
        className
      )}
    >
      {children}
    </div>
  );
}
