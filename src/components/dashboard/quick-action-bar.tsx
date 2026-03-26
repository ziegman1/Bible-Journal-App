import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

export function QuickActionBar({
  actions,
}: {
  actions: readonly { label: string; href: string }[];
}) {
  return (
    <div
      className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/40 px-3 py-3 dark:bg-muted/20"
      role="navigation"
      aria-label="Quick actions"
    >
      {actions.map((a) => (
        <Link
          key={a.href + a.label}
          href={a.href}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          {a.label}
        </Link>
      ))}
    </div>
  );
}
