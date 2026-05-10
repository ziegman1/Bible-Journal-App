/**
 * Admin Test Mode — link inventory for the QA dashboard.
 * Kinds drive labels, warnings, filters, and visual weight (safest first).
 */

export type AdminTestLinkKind = "safe-preview" | "guest-preview" | "real-data";

export type AdminTestLinkRow =
  | {
      id: string;
      kind: AdminTestLinkKind;
      label: string;
      hint?: string;
      href: string;
      /** Safe Preview: Personal 3/3rds Look Up mode UI-only (preference not saved). */
      uiOnlyPreference?: boolean;
    }
  | {
      id: string;
      kind: AdminTestLinkKind;
      label: string;
      hint?: string;
      pattern: string;
    };

export type AdminTestLinkSection = {
  id: string;
  title: string;
  /** Optional paragraph below the title (plain text). */
  description?: string;
  items: AdminTestLinkRow[];
};

/** Standard query flag so the preview banner appears for authorized testers. */
export function adminTestQuery(extra: Record<string, string> = {}): string {
  const p = new URLSearchParams({ testMode: "1", ...extra });
  return `?${p.toString()}`;
}

/** Guest-allowed paths only — admin `guestPreview=1`; middleware serves guest shell without guest cookie. */
export function adminGuestPreviewQuery(extra: Record<string, string> = {}): string {
  const p = new URLSearchParams({ guestPreview: "1", testMode: "1", ...extra });
  return `?${p.toString()}`;
}

const tq = adminTestQuery;
const gq = adminGuestPreviewQuery;

/** Sort: Safe Preview → Guest Preview → Real Data (safest first). */
export const ADMIN_TEST_LINK_KIND_ORDER: Record<AdminTestLinkKind, number> = {
  "safe-preview": 0,
  "guest-preview": 1,
  "real-data": 2,
};

export function sortAdminTestItems(items: AdminTestLinkRow[]): AdminTestLinkRow[] {
  return [...items].sort((a, b) => ADMIN_TEST_LINK_KIND_ORDER[a.kind] - ADMIN_TEST_LINK_KIND_ORDER[b.kind]);
}

export const ADMIN_TEST_LINK_SECTIONS: AdminTestLinkSection[] = [
  {
    id: "dashboard",
    title: "Dashboard & setup",
    items: sortAdminTestItems([
      { id: "dash-home", kind: "real-data", href: `/app${tq()}`, label: "Home (authenticated) + test banner" },
      {
        id: "dash-setup",
        kind: "real-data",
        href: "/app/dashboard-setup",
        label: "Dashboard setup (custom tools)",
        hint: "Uses your account state.",
      },
      { id: "dash-starthere", kind: "real-data", href: "/app/start-here", label: "Start here (may redirect if already configured)" },
    ]),
  },
  {
    id: "personal-thirds",
    title: "Personal 3/3rds Journey",
    items: sortAdminTestItems([
      {
        id: "pt-mode-dbs",
        kind: "safe-preview",
        href: `/app/groups/personal-thirds${tq({ mode: "dbs" })}`,
        label: "Authenticated · DBS mode (Look Up UI preview)",
        uiOnlyPreference: true,
      },
      {
        id: "pt-mode-dev",
        kind: "safe-preview",
        href: `/app/groups/personal-thirds${tq({ mode: "devotional" })}`,
        label: "Authenticated · Devotional mode (Look Up UI preview)",
        uiOnlyPreference: true,
      },
      {
        id: "pt-returning",
        kind: "real-data",
        href: `/app/groups/personal-thirds${tq({ state: "returning" })}`,
        label: "Authenticated · test banner (real week data)",
      },
      {
        id: "pt-g-dbs",
        kind: "guest-preview",
        href: `/app/groups/personal-thirds${gq({ mode: "dbs" })}`,
        label: "Guest preview · DBS (sessionStorage only)",
      },
      {
        id: "pt-g-dev",
        kind: "guest-preview",
        href: `/app/groups/personal-thirds${gq({ mode: "devotional" })}`,
        label: "Guest preview · Devotional",
      },
      {
        id: "pt-practice-tq",
        kind: "real-data",
        href: `/app/groups/personal-thirds/practice${tq()}`,
        label: "Practice / finalize (authenticated)",
      },
      {
        id: "pt-practice-gq",
        kind: "guest-preview",
        href: `/app/groups/personal-thirds/practice${gq()}`,
        label: "Practice · guest preview",
      },
    ]),
  },
  {
    id: "soaps",
    title: "SOAPS hub",
    items: sortAdminTestItems([
      { id: "soaps-tq", kind: "real-data", href: `/app/soaps${tq({ state: "new" })}`, label: "SOAPS hub · test banner" },
      { id: "soaps-gq", kind: "guest-preview", href: `/app/soaps${gq({ state: "guest-new" })}`, label: "Guest preview · SOAPS" },
      { id: "soaps-journal", kind: "real-data", href: `/app/journal${tq()}`, label: "Journal / entries surface" },
    ]),
  },
  {
    id: "prayer",
    title: "Prayer",
    items: sortAdminTestItems([
      { id: "prayer-tq", kind: "real-data", href: `/app/prayer${tq()}`, label: "Prayer · authenticated + banner" },
      { id: "prayer-gq", kind: "guest-preview", href: `/app/prayer${gq()}`, label: "Prayer · guest preview" },
    ]),
  },
  {
    id: "scripture",
    title: "Scripture Memory",
    items: sortAdminTestItems([
      { id: "sm-tq", kind: "real-data", href: `/app/scripture-memory${tq()}`, label: "Scripture Memory · authenticated" },
      { id: "sm-gq", kind: "guest-preview", href: `/app/scripture-memory${gq()}`, label: "Scripture Memory · guest preview" },
      {
        id: "sm-module",
        kind: "real-data",
        href: "/scripture",
        label: "Hidden scripture module (separate allowlist)",
        hint: "Uses BADWR_SCRIPTURE_MODULE_* env.",
      },
    ]),
  },
  {
    id: "share",
    title: "Share / Gospel conversations",
    items: sortAdminTestItems([
      { id: "share-tq", kind: "real-data", href: `/app/share${tq()}`, label: "Share · authenticated" },
      { id: "share-gq", kind: "guest-preview", href: `/app/share${gq()}`, label: "Share · guest preview" },
    ]),
  },
  {
    id: "chat",
    title: "CHAT",
    items: sortAdminTestItems([
      { id: "chat-tq", kind: "real-data", href: `/app/chat${tq()}`, label: "CHAT · personal (authenticated)" },
      {
        id: "chat-gq",
        kind: "guest-preview",
        href: `/app/chat${gq()}`,
        label: "CHAT · guest preview (overview)",
        hint: "Group CHAT requires auth — open a real group from 3/3rds when signed in.",
      },
    ]),
  },
  {
    id: "journey",
    title: "Guided Journey",
    items: sortAdminTestItems([
      {
        id: "journey-home",
        kind: "real-data",
        href: `/app/journey${tq()}`,
        label: "Journey home",
        hint: "May redirect based on linear path graduation.",
      },
      { id: "journey-invite", kind: "real-data", href: "/app/journey/invite", label: "Journey invite landing" },
    ]),
  },
  {
    id: "other",
    title: "Read & other surfaces",
    items: sortAdminTestItems([
      { id: "read-tq", kind: "real-data", href: `/app/read${tq()}`, label: "Read" },
      { id: "settings-tq", kind: "real-data", href: `/app/settings${tq()}`, label: "Settings / profile" },
      { id: "lo100", kind: "real-data", href: "/app/list-of-100", label: "List of 100" },
      { id: "process", kind: "real-data", href: "/app/process-map", label: "Discipleship process map" },
    ]),
  },
  {
    id: "groups",
    title: "3/3rds Groups",
    description:
      "Replace <groupId> and <meetingId> with UUIDs from your staging account. Open 3/3rds Groups in the app and copy from the address bar.",
    items: sortAdminTestItems([
      {
        id: "groups-tq",
        kind: "real-data",
        href: `/app/groups${tq({ state: "list" })}`,
        label: "Groups list · empty vs populated (your data)",
      },
      { id: "groups-new", kind: "real-data", href: "/app/groups/new", label: "Create group" },
      { id: "groups-archived", kind: "real-data", href: "/app/groups/archived", label: "Archived groups" },
      {
        id: "pat-overview",
        kind: "real-data",
        label: "Group overview",
        pattern: "/app/groups/<groupId>",
        hint: "Replace with a UUID from your account.",
      },
      {
        id: "pat-onboarding",
        kind: "real-data",
        label: "Group onboarding / starter prompt gate",
        pattern: "/app/groups/<groupId>/onboarding",
        hint: "When the group still needs the starter-track prompt.",
      },
      {
        id: "pat-starter",
        kind: "real-data",
        label: "Starter Track hub",
        pattern: "/app/groups/<groupId>/starter-track",
      },
      {
        id: "pat-starter-intro",
        kind: "real-data",
        label: "Starter Track intro",
        pattern: "/app/groups/<groupId>/starter-track/intro",
      },
      {
        id: "pat-meetings",
        kind: "real-data",
        label: "Meetings list",
        pattern: "/app/groups/<groupId>/meetings",
      },
      {
        id: "pat-meeting-new",
        kind: "real-data",
        label: "New meeting",
        pattern: "/app/groups/<groupId>/meetings/new",
      },
      {
        id: "pat-meeting-live",
        kind: "real-data",
        label: "Live meeting (participant / facilitator)",
        pattern: "/app/groups/<groupId>/meetings/<meetingId>",
        hint: "Role depends on membership; presenter link below.",
      },
      {
        id: "pat-present",
        kind: "real-data",
        label: "Presenter / facilitator mode",
        pattern: "/app/groups/<groupId>/meetings/<meetingId>/present",
        hint: "Uses facilitator layout (minimal chrome).",
      },
      {
        id: "pat-summary",
        kind: "real-data",
        label: "Meeting summary",
        pattern: "/app/groups/<groupId>/meetings/<meetingId>/summary",
      },
      {
        id: "pat-members",
        kind: "real-data",
        label: "Members & invites",
        pattern: "/app/groups/<groupId>/members",
      },
      {
        id: "invite-invalid",
        kind: "safe-preview",
        href: "/app/groups/invite/bad%20token",
        label: "Invite route (invalid token shape → error UI)",
      },
    ]),
  },
];
