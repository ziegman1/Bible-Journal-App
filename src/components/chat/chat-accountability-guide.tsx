import Link from "next/link";
import {
  CHAT_ACCOUNTABILITY_INTRO,
  CHAT_ACCOUNTABILITY_QUESTIONS,
  CHAT_EVANGELISTIC_FOCUS_HELPER,
  CHAT_EVANGELISTIC_PRAYER_INTRO,
  CHAT_EVANGELISTIC_PRAYERS,
  CHAT_READING_CHECKIN_QUESTION_INDEX,
} from "@/content/chat-accountability-content";
import { ChatReadingCheckinQuestion } from "@/components/chat/chat-reading-checkin-question";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type Props = {
  /** Meeting mode: tighter typography, questions first; prayers below with anchor. */
  variant?: "meeting" | "standalone";
  className?: string;
  /** Standalone page shows title + back link handled by parent */
  showTitle?: boolean;
  /** When set with `variant="meeting"`, question 18 collects reading check-in + optional grace restart. */
  groupId?: string;
  /** List of 100 names marked “this week” on the List of 100 page (max 5). */
  evangelisticFocusNames?: readonly string[];
};

export function ChatAccountabilityGuide({
  variant = "standalone",
  className,
  showTitle = true,
  groupId,
  evangelisticFocusNames = [],
}: Props) {
  const isMeeting = variant === "meeting";
  const focusNames = [...evangelisticFocusNames];
  return (
    <div className={cn(className)}>
      {showTitle && (
        <>
          <h1
            className={cn(
              "font-serif font-light text-stone-800 dark:text-stone-200",
              isMeeting ? "text-xl sm:text-2xl" : "mb-2 text-2xl"
            )}
          >
            Accountability questions
          </h1>
          <p
            className={cn(
              "text-stone-600 dark:text-stone-400",
              isMeeting ? "mb-6 text-sm leading-relaxed" : "mb-8 text-base"
            )}
          >
            {CHAT_ACCOUNTABILITY_INTRO}
          </p>
        </>
      )}

      <ol
        className={cn(
          "list-decimal space-y-4 pl-5 text-stone-700 dark:text-stone-300 marker:font-medium marker:text-stone-900 dark:marker:text-stone-100",
          isMeeting ? "text-[0.95rem] leading-relaxed" : "text-[0.95rem] leading-relaxed"
        )}
      >
        {CHAT_ACCOUNTABILITY_QUESTIONS.map((q, i) => (
          <li key={i} className="pl-2">
            {isMeeting && groupId && i === CHAT_READING_CHECKIN_QUESTION_INDEX ? (
              <ChatReadingCheckinQuestion groupId={groupId} questionText={q} />
            ) : (
              q
            )}
          </li>
        ))}
      </ol>

      <h2
        id="evangelistic-prayers"
        className={cn(
          "scroll-mt-20 font-serif font-light text-stone-900 dark:text-stone-100",
          isMeeting ? "mt-10 text-lg sm:text-xl" : "mt-14 text-xl"
        )}
      >
        Evangelistic prayer
      </h2>
      <p
        className={cn(
          "mt-4 text-stone-700 dark:text-stone-300",
          isMeeting ? "text-sm leading-relaxed" : "text-[0.95rem] leading-relaxed"
        )}
      >
        {CHAT_EVANGELISTIC_PRAYER_INTRO}
      </p>
      <blockquote className="my-6 border-l-4 border-amber-200 pl-4 text-stone-600 italic dark:border-amber-900/60 dark:text-stone-400">
        Brethren, my heart’s desire and my prayer for them is for their salvation.
        <footer className="mt-2 not-italic text-sm text-stone-500 dark:text-stone-500">
          — Romans 10:1
        </footer>
      </blockquote>

      <div
        className={cn(
          "my-6 rounded-xl border border-violet-200/70 bg-violet-50/50 px-4 py-4 dark:border-violet-900/50 dark:bg-violet-950/25",
          isMeeting ? "text-sm" : "text-[0.95rem]"
        )}
      >
        <p className="font-medium text-stone-900 dark:text-stone-100">Your prayer focus this week</p>
        <p className="mt-2 text-stone-600 dark:text-stone-400">{CHAT_EVANGELISTIC_FOCUS_HELPER}</p>
        {focusNames.length > 0 ? (
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-stone-800 dark:text-stone-200">
            {focusNames.map((name, i) => (
              <li key={`${i}-${name}`}>{name}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            Select up to 5 people from your List of 100 to pray for this week.
          </p>
        )}
        <Link
          href="/app/list-of-100"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-4 inline-flex"
          )}
        >
          List of 100
        </Link>
      </div>

      <ol
        className={cn(
          "list-decimal space-y-4 pl-5 text-stone-700 dark:text-stone-300 marker:font-medium marker:text-stone-900 dark:marker:text-stone-100",
          isMeeting ? "text-[0.95rem] leading-relaxed" : "text-[0.95rem] leading-relaxed"
        )}
      >
        {CHAT_EVANGELISTIC_PRAYERS.map((p, i) => (
          <li key={i} className="pl-2">
            {p}
          </li>
        ))}
      </ol>
    </div>
  );
}
