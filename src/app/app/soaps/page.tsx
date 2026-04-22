import Link from "next/link";
import { BookMarked, BookOpen, Share2 } from "lucide-react";
import { getSoapsHomeActionHref } from "@/app/actions/soaps-home-action";
import { SoapsOverviewTraining } from "@/components/soaps-overview-training";
import { SoapsTrainingCollapsible } from "@/components/soaps/soaps-training-collapsible";
import { SoapsZumeEmbed } from "@/components/soaps/soaps-zume-embed";
import { createClient } from "@/lib/supabase/server";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import { soapsTrainingDefaultExpanded } from "@/lib/soaps/soaps-training-default-open";
import { cn } from "@/lib/utils";

export default async function SoapsHubPage() {
  const soapsAction = await getSoapsHomeActionHref();

  let experienceMode = null as ReturnType<typeof normalizeAppExperienceMode>;
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("app_experience_mode")
        .eq("id", user.id)
        .maybeSingle();
      experienceMode = normalizeAppExperienceMode(profile?.app_experience_mode);
    }
  }

  const trainingDefaultExpanded = soapsTrainingDefaultExpanded(experienceMode);

  const secondaryActions: {
    title: string;
    description: string;
    href: string;
    icon: typeof BookOpen;
  }[] = [
    {
      title: "My SOAPS journal",
      description: "Entries, search, and history.",
      href: "/app/journal",
      icon: BookMarked,
    },
    {
      title: "Invite someone to SOAPS",
      description: "Email, text, or copy a signup link so they can try BADWR.",
      href: "/app/soaps/invite",
      icon: Share2,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 pb-16">
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

      <Link
        href={soapsAction.href}
        className={cn(
          "group flex flex-col rounded-xl border p-5 shadow-sm transition-colors",
          "border-sky-200/80 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30",
          "dark:border-sky-500/20 dark:from-card dark:via-sky-950/15 dark:to-blue-950/10",
          "hover:border-sky-300/90 hover:shadow-sm"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">Start today’s SOAPS</h2>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100/80 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
            <BookOpen className="size-4" aria-hidden />
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick up where your dashboard would—same reading path.
        </p>
        <span className="mt-3 text-xs font-medium text-sky-700 group-hover:underline dark:text-sky-400">
          Open →
        </span>
      </Link>

      <SoapsTrainingCollapsible defaultExpanded={trainingDefaultExpanded}>
        <SoapsOverviewTraining embedded />
        <SoapsZumeEmbed />
      </SoapsTrainingCollapsible>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {secondaryActions.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                href={c.href}
                className={cn(
                  "group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-colors",
                  "hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
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
