import Link from "next/link";
import { cn } from "@/lib/utils";

/** Minimal dashboard tile: title, description, CTA link. */
export function SimpleToolLinkCard({
  title,
  description,
  href,
  ctaLabel = "Open",
}: {
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        "flex flex-col gap-2 min-h-[5.5rem]"
      )}
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground leading-snug">{description}</p>
      </div>
      <Link
        href={href}
        className="mt-auto text-xs font-medium text-primary underline-offset-4 hover:underline w-fit"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
