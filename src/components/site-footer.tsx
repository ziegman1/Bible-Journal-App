import Link from "next/link";
import {
  APP_MARKETING_NAME,
  APP_SHORT_NAME,
  getSupportContactHref,
  getSupportEmail,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteFooter({
  className,
  variant = "default",
}: {
  className?: string;
  /** `compact` for app shell (single row). */
  variant?: "default" | "compact";
}) {
  const year = new Date().getFullYear();
  const supportEmail = getSupportEmail();

  return (
    <footer
      className={cn(
        "text-stone-500 dark:text-stone-400",
        variant === "compact" ? "text-xs leading-relaxed" : "text-sm",
        className
      )}
    >
      <nav
        aria-label="Legal and support"
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-3 gap-y-1",
          variant === "compact" && "gap-x-4"
        )}
      >
        <Link
          href="/privacy"
          className="underline underline-offset-2 text-stone-700 dark:text-stone-300 min-h-[44px] min-w-[44px] inline-flex items-center justify-center sm:min-h-0 sm:min-w-0 sm:inline"
        >
          Privacy
        </Link>
        <span className="opacity-40" aria-hidden>
          ·
        </span>
        <Link
          href="/terms"
          className="underline underline-offset-2 text-stone-700 dark:text-stone-300 min-h-[44px] min-w-[44px] inline-flex items-center justify-center sm:min-h-0 sm:min-w-0 sm:inline"
        >
          Terms
        </Link>
        <span className="opacity-40" aria-hidden>
          ·
        </span>
        <a
          href={getSupportContactHref()}
          className="underline underline-offset-2 text-stone-700 dark:text-stone-300 min-h-[44px] min-w-[44px] inline-flex items-center justify-center sm:min-h-0 sm:min-w-0 sm:inline"
        >
          Support
        </a>
      </nav>
      <p
        className={cn(
          "mt-3 text-center text-stone-500 dark:text-stone-500",
          variant === "compact" && "mt-2"
        )}
      >
        © {year} {APP_SHORT_NAME} · {APP_MARKETING_NAME}
        {supportEmail ? (
          <>
            {" "}
            <span className="hidden sm:inline">·</span>{" "}
            <span className="block sm:inline text-xs sm:text-[inherit]">{supportEmail}</span>
          </>
        ) : null}
      </p>
    </footer>
  );
}
