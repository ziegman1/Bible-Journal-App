import Link from "next/link";
import { BookMarked, BookOpen, Heart, MessageCircle, ScrollText, Share2, Users } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { IdentityCoreCard } from "@/components/dashboard/identity-core-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const GUEST_DEMO_STATS = [
  { label: "SOAPS streak", value: "4 days" },
  { label: "Prayer streak", value: "3 days" },
  { label: "Share streak", value: "2 days" },
  { label: "Scripture Memory streak", value: "5 days" },
  { label: "CHAT weekly streak", value: "1 week" },
  { label: "3/3 weekly streak", value: "2 weeks" },
] as const;

const practiceCards: {
  title: string;
  description: string;
  href: string;
  icon: typeof BookMarked;
}[] = [
  {
    title: "SOAPS",
    description: "Scripture, observation, application, prayer, share.",
    href: "/app/soaps",
    icon: BookMarked,
  },
  {
    title: "Pray",
    description: "Prayer rhythms and focused time.",
    href: "/app/prayer",
    icon: Heart,
  },
  {
    title: "Share",
    description: "Gospel conversations and encounters.",
    href: "/app/share",
    icon: Share2,
  },
  {
    title: "Scripture Memory",
    description: "Memorize and review passages.",
    href: "/app/scripture-memory",
    icon: ScrollText,
  },
  {
    title: "CHAT",
    description: "Weekly accountability rhythm (preview).",
    href: "/app/chat",
    icon: MessageCircle,
  },
  {
    title: "Personal 3/3rds",
    description: "Solo Look Back · Look Up · Look Forward (local preview).",
    href: "/app/groups/personal-thirds",
    icon: Users,
  },
];

function GuestTeaserSection({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="rounded-xl border border-dashed border-border bg-muted/25 p-4 text-sm text-muted-foreground">
        <p>{body}</p>
        <Link
          href="/signup?fromGuest=1"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3 inline-flex touch-manipulation")}
        >
          Create account to unlock
        </Link>
      </div>
    </section>
  );
}

export function GuestDashboardHome() {
  return (
    <DashboardLayout
      header={<DashboardHeader />}
      identity={
        <section aria-labelledby="guest-dashboard-identity" className="flex h-full min-h-0 flex-col gap-4">
          <h2 id="guest-dashboard-identity" className="sr-only">
            Guest preview
          </h2>
          <IdentityCoreCard
            displayName="Guest"
            nextActionLabel="Start today's SOAPS"
            nextActionHref="/app/read/matthew/1"
            prayHref="/app/prayer"
            prayLabel="Pray"
            stats={[...GUEST_DEMO_STATS]}
            invitationalSubtitle={null}
          />
          <p className="text-center text-xs text-muted-foreground">
            Streak numbers above are examples only and are not saved.
          </p>
        </section>
      }
      daily={
        <section aria-labelledby="guest-daily-heading">
          <h2 id="guest-daily-heading" className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Daily practice
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {practiceCards.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  className={cn(
                    "flex min-h-[120px] flex-col rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors",
                    "hover:border-foreground/15 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                    <span className="text-sm font-medium text-foreground">{c.title}</span>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
                  <span className="mt-2 text-xs font-medium text-primary">Open preview →</span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/app/read"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-4 inline-flex w-full touch-manipulation sm:w-auto"
            )}
          >
            <BookOpen className="mr-2 size-4" aria-hidden />
            Browse Scripture
          </Link>
        </section>
      }
      community={
        <GuestTeaserSection
          title="Community"
          body="Groups, family hub, and shared meeting spaces stay tied to a real account so everyone’s data stays private and in sync."
        />
      }
      multiplication={
        <GuestTeaserSection
          title="Multiplication"
          body="Pathway, growth tools, and coaching views unlock after you sign in."
        />
      }
    />
  );
}
