import Link from "next/link";
import { ImportVersesForm } from "@/components/scripture-module/import-verses-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function ScriptureSettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Settings
        </p>
        <h1 className="text-2xl font-serif font-light text-foreground">Scripture module</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Import passages and manage lists. Memorization and review settings will be added as those
          features land.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Import verses</h2>
        <ImportVersesForm />
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Lists</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create, rename, and open lists from the lists hub.
        </p>
        <Link
          href="/scripture/lists"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex")}
        >
          Manage lists
        </Link>
      </section>
    </div>
  );
}
