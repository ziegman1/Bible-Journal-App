import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { APP_MARKETING_NAME, APP_SHORT_NAME } from "@/lib/site-config";

/** Shared chrome for /privacy and /terms — mobile-first readable column. */
export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="shrink-0 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="font-serif text-lg font-light text-stone-800 dark:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 min-h-[44px] inline-flex items-center"
          >
            {APP_SHORT_NAME}
          </Link>
          <span className="text-xs text-stone-500 dark:text-stone-400 truncate">{APP_MARKETING_NAME}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <h1 className="text-2xl font-serif font-light text-stone-900 dark:text-stone-100">
          {title}
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Last updated: {lastUpdated}</p>
        <div className="mt-8 max-w-none text-sm leading-relaxed text-stone-700 dark:text-stone-300 space-y-6 [&_section]:space-y-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-stone-900 [&_h2]:dark:text-stone-100 [&_h2]:first:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1.5">
          {children}
        </div>
      </main>
      <div className="shrink-0 border-t border-stone-200 dark:border-stone-800 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <SiteFooter className="max-w-2xl mx-auto" />
      </div>
    </div>
  );
}
