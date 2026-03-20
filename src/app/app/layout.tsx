import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const isInviteRoute = headersList.get("x-invite-route") === "1";

  const supabase = await createClient();
  if (!supabase) {
    redirect("/setup");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Invite acceptance page allows unauthenticated access; middleware sets x-invite-route
  if (!user && !isInviteRoute) {
    redirect("/login");
  }

  if (isInviteRoute && !user) {
    return <div className="min-h-screen bg-stone-50 dark:bg-stone-950">{children}</div>;
  }

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("display_name, reading_mode, journal_year, onboarding_complete")
    .eq("id", user.id)
    .single();

  // Backfill profile for users who signed up before handle_new_user trigger fix
  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: (user.user_metadata?.display_name as string) ?? "Reader",
      },
      { onConflict: "id" }
    );
    const { data: created } = await supabase
      .from("profiles")
      .select("display_name, reading_mode, journal_year, onboarding_complete")
      .eq("id", user.id)
      .single();
    profile = created ?? profile;
  }

  const needsOnboarding = !profile?.onboarding_complete;

  if (needsOnboarding) {
    redirect("/onboarding");
  }

  return (
    <AppShell displayName={profile?.display_name ?? undefined}>
      {children}
    </AppShell>
  );
}
