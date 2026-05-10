import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isBadwrAdminTestUser } from "@/lib/admin/badwr-admin-test-access";

export default async function AppAdminSectionLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) notFound();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isBadwrAdminTestUser(user)) notFound();
  return children;
}
