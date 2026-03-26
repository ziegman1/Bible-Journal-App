import {
  CHAT_ACCOUNTABILITY_INTRO,
  CHAT_ACCOUNTABILITY_QUESTIONS,
  CHAT_EVANGELISTIC_PRAYER_INTRO,
  CHAT_EVANGELISTIC_PRAYERS,
} from "@/content/chat-accountability-content";
import { cn } from "@/lib/utils";

type Props = {
  /** Meeting mode: tighter typography, questions first; prayers below with anchor. */
  variant?: "meeting" | "standalone";
  className?: string;
  /** Standalone page shows title + back link handled by parent */
  showTitle?: boolean;
};

export function ChatAccountabilityGuide({
  variant = "standalone",
  className,
  showTitle = true,
}: Props) {
  const isMeeting = variant === "meeting";
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
            {q}
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
