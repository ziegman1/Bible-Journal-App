import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GenMapView } from "@/components/gen-map/gen-map-view";

export default async function ThreeThirdsFamilyGenMapPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">3/3rds Family</h1>
          <p className="text-sm text-muted-foreground">
            Gen Map — church-based multiplication. Gen 0 is your 3/3rds family hub, not an individual
            contact.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link
            href="/app/groups"
            className="text-muted-foreground underline decoration-dotted hover:text-foreground"
          >
            All groups
          </Link>
          <Link
            href="/app"
            className="text-muted-foreground underline decoration-dotted hover:text-foreground"
          >
            Back to app
          </Link>
        </div>
      </div>
      <GenMapView />
    </div>
  );
}
