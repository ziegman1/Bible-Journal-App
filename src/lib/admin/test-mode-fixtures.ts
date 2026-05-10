/**
 * In-memory fixtures for admin test documentation only.
 * Do not import from production data paths — these are not written to Supabase.
 *
 * Use for future client-only mock panels or Storybook-style QA harnesses.
 */

export const ADMIN_TEST_FIXTURE_NOTE =
  "Optional seeds and fake rows belong in isolated harnesses or clearly named test tables — never mix with real user rows.";

export type AdminTestFixtureStub = {
  id: string;
  label: string;
  description: string;
};

/** Placeholder list for dashboard copy — not loaded by runtime tools unless explicitly wired. */
export const ADMIN_TEST_STUBS: AdminTestFixtureStub[] = [
  { id: "group", label: "3/3rds group", description: "Use a real staging group UUID in links, or create one in Supabase staging." },
  { id: "meeting", label: "Group meeting", description: "Open an existing meeting from the group’s Meetings list." },
  { id: "prayer", label: "Prayer list", description: "Empty vs filled states come from your account data in non-preview mode." },
  { id: "scripture", label: "Scripture Memory", description: "Library states depend on saved verses; guest mode uses local demo limits." },
];
