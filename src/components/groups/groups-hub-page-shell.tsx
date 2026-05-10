"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ExternalLink, HelpCircle, MoreHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function LearnDrawerBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-4 text-sm leading-snug text-muted-foreground">
      <p className="text-foreground/95">A simple way to meet with others and grow as a disciple.</p>
      <div id="groups-hub-join-help" className="rounded-lg border border-border bg-muted/30 p-3 text-xs scroll-mt-4">
        <p className="font-medium text-foreground">Joining a group</p>
        <p className="mt-1 text-muted-foreground">
          Ask your facilitator for an email invite. Use the link they send to join—there isn’t a
          public directory of groups.
        </p>
      </div>
      <p className="text-foreground/90">Each time together follows three movements:</p>
      <ul className="list-none space-y-2 pl-0">
        <li>
          <span className="font-medium text-foreground">Look Back</span>
          <span> — How did you obey and share this week?</span>
        </li>
        <li>
          <span className="font-medium text-foreground">Look Up</span>
          <span> — What is God saying in His Word?</span>
        </li>
        <li>
          <span className="font-medium text-foreground">Look Forward</span>
          <span> — What will you do and who will you share with?</span>
        </li>
      </ul>
      <p>
        Meet with a group—or continue{" "}
        <Link
          href="/app/groups/personal-thirds"
          className="font-medium text-foreground underline-offset-2 hover:underline"
          onClick={onNavigate}
        >
          your personal 3/3rds journey
        </Link>{" "}
        in the app.
      </p>
      <p>
        <a
          href="https://zume.training/3-3-group-meeting-pattern"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
        >
          Watch a short walkthrough (Zúme)
          <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
        </a>
      </p>
    </div>
  );
}

export function GroupsHubPageShell({
  resumeHref,
  initialLearnOpen = false,
  subtitle,
  children,
}: {
  resumeHref: string | null;
  /** Open the learn sheet once on mount (e.g. no groups or no 3/3rds completions yet). */
  initialLearnOpen?: boolean;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [learnOpen, setLearnOpen] = useState(false);
  const [joinFirst, setJoinFirst] = useState(false);

  useEffect(() => {
    if (!initialLearnOpen) return;
    setJoinFirst(false);
    setLearnOpen(true);
  }, [initialLearnOpen]);

  useEffect(() => {
    if (!learnOpen || !joinFirst) return;
    const id = window.requestAnimationFrame(() => {
      document.getElementById("groups-hub-join-help")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [learnOpen, joinFirst]);

  function openLearn(joinSection: boolean) {
    setJoinFirst(joinSection);
    setLearnOpen(true);
  }

  return (
    <>
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-2xl font-serif font-light text-stone-800 dark:text-stone-200">
                3/3rds Groups
              </h1>
              <button
                type="button"
                onClick={() => openLearn(false)}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 sm:text-sm"
              >
                <HelpCircle className="size-3.5 shrink-0 opacity-80 sm:size-4" aria-hidden />
                <span className="hidden sm:inline">What is 3/3rds?</span>
                <span className="sm:hidden">Learn</span>
              </button>
            </div>
            {subtitle}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              aria-label="More options"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 outline-none hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-44">
              <DropdownMenuItem
                onClick={() => router.push("/app/groups/archived")}
                className="text-stone-800 dark:text-stone-200"
              >
                <Archive className="size-4 shrink-0" aria-hidden />
                Archived 3/3rds
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <section aria-label="Quick actions" className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 touch-manipulation"
            onClick={() => openLearn(true)}
          >
            Join with invite
          </Button>
          {resumeHref ? (
            <Link
              href={resumeHref}
              className={cn(
                buttonVariants({ size: "sm" }),
                "min-h-10 touch-manipulation inline-flex items-center justify-center"
              )}
            >
              Resume session
            </Link>
          ) : null}
          <Link
            href="/app/groups/new"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "min-h-10 touch-manipulation text-stone-600 dark:text-stone-400"
            )}
          >
            Create a group
          </Link>
        </section>
      </header>

      <Sheet open={learnOpen} onOpenChange={setLearnOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 sm:max-w-lg" showCloseButton>
          <SheetHeader className="border-b border-border pb-4 text-left">
            <SheetTitle className="text-lg font-semibold text-foreground">What is 3/3rds?</SheetTitle>
            <SheetDescription className="sr-only">
              Primer on the three movements, joining a group with an invite, personal journey in
              the app, and an external walkthrough link.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <LearnDrawerBody onNavigate={() => setLearnOpen(false)} />
          </div>
          <SheetFooter className="border-t border-border px-4 pb-4">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setLearnOpen(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {children}
    </>
  );
}
