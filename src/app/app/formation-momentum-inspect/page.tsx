import { redirect } from "next/navigation";
import { getFormationMomentumInspect } from "@/app/actions/formation-momentum-dashboard";
import { createClient } from "@/lib/supabase/server";

/**
 * Internal inspection page for the formation-momentum engine (`explain: true`).
 * Not linked from main nav — intended for tuning during live testing. Keeps large JSON off default UI.
 */
export default async function FormationMomentumInspectPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getFormationMomentumInspect();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-lg font-medium text-foreground">Formation momentum — inspect</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Full snapshot with explain payload. For internal tuning only.
      </p>
      <pre className="mt-4 max-h-[70vh] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
