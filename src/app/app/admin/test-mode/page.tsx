import type { Metadata } from "next";
import { AdminTestModeLinksDashboard } from "@/components/admin/admin-test-mode-links-dashboard";

export const metadata: Metadata = {
  title: "Admin Test Mode — BADWR",
  robots: { index: false, follow: false },
};

export default function AdminTestModePage() {
  return <AdminTestModeLinksDashboard />;
}
