import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessGuidedJourney } from "@/lib/guided-journey/guided-journey-access";

export default async function JourneySegmentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!canAccessGuidedJourney(user)) {
    notFound();
  }

  return <>{children}</>;
}
