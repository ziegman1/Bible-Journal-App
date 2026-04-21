import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  ExternalLink,
  FileText,
  HelpCircle,
  LayoutGrid,
  Share2,
} from "lucide-react";
import { getSoapsHomeActionHref } from "@/app/actions/soaps-home-action";
import { SOAPS_HUB_PDF_URL, SOAPS_HUB_ZUME_VIDEO_URL } from "@/lib/config/soaps-hub-resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { SoapsOverviewTraining } from "@/components/soaps-overview-training";
import { cn } from "@/lib/utils";

export default async function SoapsHubPage() {
  const soapsAction = await getSoapsHomeActionHref();

  const cards: {
    title: string;
    description: string;
    href: string;
    primary?: boolean;
    icon: typeof BookOpen;
  }[] = [
    {
      title: "Start today’s SOAPS",
      description: "Pick up where your dashboard would—same reading path.",
      href: soapsAction.href,
      primary: true,
      icon: BookOpen,
    },
    {
      title: "My SOAPS journal",
      description: "Entries, search, and history.",
      href: "/app/journal",
      icon: BookMarked,
    },
    {
      title: "Reading plan / progress",
      description: "Reader and chapter progress.",
      href: "/app/read",
      icon: LayoutGrid,
    },
    {
      title: "SOAPS history / archive",
      description: "Browse and open past entries.",
      href: "/app/journal",
      icon: FileText,
    },
    {
      title: "Share a SOAPS",
      description: "Log gospel and testimony shares.",
      href: "/app/share",
      icon: Share2,
    },
    {
      title: "SOAPS help / how to",
      description: "Themes, insights, and study threads.",
      href: "/app/themes",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6 pb-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-serif font-light text-stone-900 dark:text-stone-100">
          SOAPS
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          SOAPS is a simple pattern for meeting God in Scripture: Scripture, Observation, Application,
          Prayer, and Share—so truth moves from the page into your life and relationships.
        </p>
        <p className="text-sm italic text-stone-500 dark:text-stone-500">
          Become a disciple that the Lord would delight in reproducing.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Learn
        </h2>
        <SoapsOverviewTraining />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SOAPS overview (PDF)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Optional printable handout of the SOAPS pattern. Set{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SOAPS_PDF_URL</code> when your
                PDF is ready.
              </p>
              <a
                href={SOAPS_HUB_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex items-center gap-2"
                )}
              >
                Open PDF
                <ExternalLink className="size-3.5 opacity-70" aria-hidden />
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zúme: SOAPS Bible reading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Video walkthrough of the SOAPS format (placeholder URL configurable via{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SOAPS_ZUME_VIDEO_URL</code>).
              </p>
              <a
                href={SOAPS_HUB_ZUME_VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex items-center gap-2"
                )}
              >
                Open video
                <ExternalLink className="size-3.5 opacity-70" aria-hidden />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                href={c.href}
                className={cn(
                  "group flex flex-col rounded-xl border p-5 shadow-sm transition-colors",
                  c.primary
                    ? "border-sky-200/80 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30 dark:border-sky-500/20 dark:from-card dark:via-sky-950/15 dark:to-blue-950/10"
                    : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      c.primary
                        ? "bg-sky-100/80 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
                <span className="mt-3 text-xs font-medium text-sky-700 group-hover:underline dark:text-sky-400">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/app" className="underline underline-offset-2 hover:text-foreground">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
