import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  GUIDED_SOAPS_REST_NEXT_SOON_LINE,
  GUIDED_SOAPS_REST_PANEL_BODY,
  GUIDED_SOAPS_REST_PANEL_LEAD,
} from "@/lib/guided-journey/journey-formation-messages";

export function GuidedSoapsRestPanel({
  title,
  soapsReaderHref,
}: {
  title: string;
  soapsReaderHref: string;
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-stone-50/80 p-6 shadow-sm dark:border-emerald-900/35 dark:from-emerald-950/25 dark:via-stone-950 dark:to-stone-950/80 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800/90 dark:text-emerald-200/90">
          {title}
        </p>
        <h2 className="mt-3 font-serif text-xl font-light text-stone-900 dark:text-stone-100">
          Space to live this out
        </h2>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
          <p className="font-medium text-stone-900 dark:text-stone-100">{GUIDED_SOAPS_REST_PANEL_LEAD}</p>
          <p>{GUIDED_SOAPS_REST_PANEL_BODY}</p>
        </div>
        <p className="mt-5 text-xs text-stone-500 dark:text-stone-400">{GUIDED_SOAPS_REST_NEXT_SOON_LINE}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={soapsReaderHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex min-h-10 items-center justify-center gap-2"
          )}
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          Return to SOAPS
        </Link>
        <Link
          href="/app"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "inline-flex min-h-10 items-center justify-center text-stone-600 dark:text-stone-400"
          )}
        >
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
