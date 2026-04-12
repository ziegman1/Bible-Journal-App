/**
 * Shared visual tokens for 3/3rds participant input + live responses.
 * UI-only — keep in sync across look-back, look-up, look-forward.
 */
import { cn } from "@/lib/utils";

/** Calm, focused textareas (meeting flow). */
export function meetingTextareaClass(extra?: string) {
  return cn(
    "min-h-[4.5rem] w-full resize-none rounded-md border border-[#e0dcd7] bg-white px-3 py-2.5 text-sm text-[#1c252e]",
    "placeholder:text-muted-foreground/65",
    "focus-visible:border-[#83b0da] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#83b0da]/30",
    extra
  );
}

/** Current user’s editable block — distinct from live group area. */
export const meetingYourRegion =
  "rounded-lg border border-[#e0dcd7]/80 bg-[#fafaf9] px-4 py-4 sm:px-5 sm:py-5 text-[#1c252e] dark:border-stone-600/70 dark:bg-stone-900/85 dark:text-stone-100";

export const meetingYourLabel =
  "text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-[#5c6570] dark:text-stone-400";

/** Others’ live responses — separated below your input. */
export const meetingLiveRegion = "mt-8 border-t border-[#e8e4df] pt-7 space-y-4";

export const meetingLiveLabel =
  "text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-[#83b0da]";

/** One other person’s entry — divider stack, not a mini-card. */
export const meetingLiveRow =
  "border-b border-[#ebe9e6] pb-5 last:border-b-0 last:pb-0";

export const meetingLiveName = "text-sm font-semibold text-[#1c252e]";

export const meetingLiveBody =
  "mt-1.5 text-sm leading-relaxed text-[#5c6570] whitespace-pre-wrap";

export const meetingLiveEmpty =
  "text-sm text-muted-foreground/90 italic";

/** Reference / read-only context (e.g. last week’s commitments). */
export const meetingReferenceBox =
  "rounded-lg border border-[#e5e1dc]/70 bg-[#f8f7f5]/90 px-4 py-3.5 text-sm";

/** Inner padding / vertical rhythm for main meeting step cards (border/accent stays per-section). */
export const meetingSectionPadding = "p-6 sm:p-7 space-y-6 sm:space-y-7";
