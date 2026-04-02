import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStarterTrackPromptGateForGroup } from "@/app/actions/groups";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}

export default async function StarterTrackSectionLayout({
  children,
  params,
}: LayoutProps) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/setup");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Uses groupNeedsStarterTrackPrompt via getStarterTrackPromptGateForGroup (same as meeting routes).
  const gate = await getStarterTrackPromptGateForGroup(groupId);
  if ("error" in gate) {
    if (gate.error === "Not a member of this group") redirect("/app/groups");
    notFound();
  }
  if (gate.needsPrompt) {
    redirect(`/app/groups/${groupId}/onboarding`);
  }

  return <>{children}</>;
}
