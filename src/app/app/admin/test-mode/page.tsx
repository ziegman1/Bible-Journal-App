import type { Metadata } from "next";
import { AdminTestModeLinksDashboard } from "@/components/admin/admin-test-mode-links-dashboard";
import { AdminTestThirdsSandboxPanel } from "@/components/admin/admin-test-thirds-sandbox-panel";
import { getAdminSandboxThirdsGroupIdForTester } from "@/app/actions/admin-sandbox-third-group";

export const metadata: Metadata = {
  title: "Admin Test Mode — BADWR",
  robots: { index: false, follow: false },
};

export default async function AdminTestModePage() {
  const { groupId } = await getAdminSandboxThirdsGroupIdForTester();
  return (
    <>
      <AdminTestThirdsSandboxPanel initialGroupId={groupId} />
      <AdminTestModeLinksDashboard />
    </>
  );
}
