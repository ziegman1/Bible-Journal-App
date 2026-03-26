import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroup } from "@/app/actions/groups";

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

  const result = await getGroup(groupId);
  if (result.error || !result.group) {
    if (result.error === "Not a member of this group") redirect("/app/groups");
    notFound();
  }

  const g = result.group as { onboarding_pending?: boolean | null };
  if (g.onboarding_pending === true) {
    redirect(`/app/groups/${groupId}/onboarding`);
  }

  return <>{children}</>;
}
