import { notFound, redirect } from "next/navigation";
import { ScriptureModuleDevAccessDenied } from "@/components/scripture-module/scripture-module-dev-access-denied";
import { ScriptureModuleShell } from "@/components/scripture-module/scripture-module-shell";
import {
  evaluateScriptureModuleAccess,
  getEmailForScriptureAccess,
  getScriptureAccessDebugSnapshot,
  isNextJsDevelopment,
} from "@/lib/scripture-module/access";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scripture Memory (preview)",
  robots: { index: false, follow: false },
};

export default async function ScriptureModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/setup");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

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
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();
    profile = created ?? profile;
  }

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  const sessionEmail = getEmailForScriptureAccess(user);
  const access = evaluateScriptureModuleAccess(sessionEmail);
  if (access.allowed) {
    return <ScriptureModuleShell>{children}</ScriptureModuleShell>;
  }

  if (isNextJsDevelopment()) {
    return (
      <ScriptureModuleDevAccessDenied
        email={sessionEmail}
        deniedReason={access.reason}
        debug={getScriptureAccessDebugSnapshot(sessionEmail, access)}
      />
    );
  }

  notFound();
}
