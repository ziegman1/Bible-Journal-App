import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

/** Annual Journey now lives on the SOAPS page (`/app/journal`); keep URL for bookmarks. */
export default async function AnnualJournalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.year) q.set("year", params.year);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  redirect(`/app/journal${suffix}`);
}
