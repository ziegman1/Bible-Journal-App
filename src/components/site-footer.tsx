import Link from "next/link";
import { BadwrLogo } from "@/components/badwr-logo";
import {
  APP_SHORT_NAME,
  APP_TAGLINE,
  getPublicSupportEmail,
  getPublicSupportMailtoHref,
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
  const supportEmail = getPublicSupportEmail();

  return (
    <footer
      className={cn(
        "text-stone-500 dark:text-stone-400",
        variant === "compact" ? "text-xs leading-relaxed" : "text-sm",
        className
      )}
    >
      <div
        className={cn(
          "flex justify-center",
          variant === "compact" ? "mb-1.5" : "mb-2"
        )}
      >
        <BadwrLogo variant={variant === "compact" ? "micro" : "footer"} />
      </div>
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
          href={getPublicSupportMailtoHref()}
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
        © {year} {APP_SHORT_NAME} · {APP_TAGLINE}
        {" "}
        <span className="hidden sm:inline">·</span>{" "}
        <a
          href={getPublicSupportMailtoHref()}
          className="block sm:inline text-xs sm:text-[inherit] underline underline-offset-2 text-stone-700 dark:text-stone-300"
        >
          {supportEmail}
        </a>
      </p>
    </footer>
  );
}
