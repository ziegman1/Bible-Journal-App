import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function SoapsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-serif font-light text-stone-900 dark:text-stone-100">
          SOAPS
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Placeholder route for the new dashboard flow. Connect this page to the full
          SOAPS experience next.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SOAPS training video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Zúme Training walks through the SOAPS Bible reading format—Scripture, Observation,
            Application, Prayer, and Sharing—with video and examples.
          </p>
          <a
            href="https://zume.training/soaps-bible-reading"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex items-center gap-2"
            )}
          >
            Open SOAPS Bible Reading on Zúme
            <ExternalLink className="size-3.5 opacity-70" aria-hidden />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4" />
            Current handoff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            TODO: route this page into the dedicated SOAPS workflow. For now, use the
            journal hub.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/journal" className={cn(buttonVariants())}>
              Open Journal
            </Link>
            <Link
              href="/app"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
