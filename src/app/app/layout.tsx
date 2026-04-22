import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const isInviteRoute = headersList.get("x-invite-route") === "1";
  const isFacilitatorPresent =
    headersList.get("x-facilitator-present") === "1";

  const supabase = await createClient();
  if (!supabase) {
    redirect("/setup");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Invite link: minimal shell for everyone; skip onboarding until after accept.
  // Otherwise new users who sign in hit /onboarding before acceptGroupInvite runs.
  if (isInviteRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1">{children}</div>
        <div className="shrink-0 border-t border-border px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SiteFooter variant="compact" />
        </div>
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("display_name, reading_mode, journal_year, onboarding_complete, app_experience_mode")
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
      .select("display_name, reading_mode, journal_year, onboarding_complete, app_experience_mode")
      .eq("id", user.id)
      .single();
    profile = created ?? profile;
  }

  const needsOnboarding = !profile?.onboarding_complete;

  if (needsOnboarding) {
    redirect("/onboarding");
  }

  if (isFacilitatorPresent) {
    return <>{children}</>;
  }

  const experienceMode = normalizeAppExperienceMode(profile?.app_experience_mode);
  if (!experienceMode) {
    redirect("/start-here");
  }

  return (
    <AppShell displayName={profile?.display_name ?? undefined}>
      {children}
    </AppShell>
  );
}
