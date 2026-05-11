import { Suspense } from "react";
import { AdminSandboxGroupBanner } from "@/components/admin/admin-sandbox-group-banner";
import { createClient } from "@/lib/supabase/server";

export default async function GroupDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  if (!supabase) return children;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return children;

  const { data: mem } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) return children;

  const { data: g } = await supabase
    .from("groups")
    .select("badwr_admin_sandbox")
    .eq("id", groupId)
    .maybeSingle();

  const isSandbox = Boolean(
    g && typeof g === "object" && "badwr_admin_sandbox" in g && (g as { badwr_admin_sandbox?: boolean }).badwr_admin_sandbox
  );
  if (!isSandbox) return children;

  return (
    <>
      <Suspense fallback={null}>
        <AdminSandboxGroupBanner groupId={groupId} />
      </Suspense>
      {children}
    </>
  );
}
