import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function PrayerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-serif font-light text-stone-900 dark:text-stone-100">
          Prayer
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Placeholder route for the dashboard card. This gives the dashboard a stable
          destination now without overbuilding the feature.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-4" />
            Next implementation step
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            TODO: connect this page to a real prayer workflow or list when that feature is
            ready.
          </p>
          <Link
            href="/app"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
