"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReadingMode = "canonical" | "chronological" | "custom" | "free_reading";

interface OnboardingFormProps {
  defaultDisplayName: string;
  defaultReadingMode: ReadingMode;
  defaultJournalYear: number;
}

export function OnboardingForm({
  defaultDisplayName,
  defaultReadingMode,
  defaultJournalYear,
}: OnboardingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [readingMode, setReadingMode] = useState<ReadingMode>(defaultReadingMode);
  const [journalYear, setJournalYear] = useState(defaultJournalYear);

  const currentYear = new Date().getFullYear();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateProfile({
      display_name: displayName,
      reading_mode: readingMode,
      journal_year: journalYear,
      onboarding_complete: true,
    });

    if (result?.error) {
      const msg = result.error.toLowerCase().includes("profiles") ||
        result.error.toLowerCase().includes("schema cache")
        ? "Database not set up. Run the SQL migrations in Supabase (see SUPABASE_SETUP.md)."
        : result.error;
      setError(msg);
      setLoading(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How would you like to be called?"
          required
          className="bg-white dark:bg-stone-900"
        />
      </div>
      <div className="space-y-2">
        <Label>Preferred Reading Style</Label>
        <Select
          value={readingMode}
          onValueChange={(v) => { if (v != null) setReadingMode(v as ReadingMode); }}
        >
          <SelectTrigger className="w-full bg-white dark:bg-stone-900">
            <SelectValue placeholder="Select reading style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="canonical">Canonical (book order)</SelectItem>
            <SelectItem value="chronological">Chronological</SelectItem>
            <SelectItem value="custom">Custom plan</SelectItem>
            <SelectItem value="free_reading">Free reading</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Journal Year</Label>
        <Select
          value={String(journalYear)}
          onValueChange={(v) => { if (v != null) setJournalYear(parseInt(String(v), 10)); }}
        >
          <SelectTrigger className="w-full bg-white dark:bg-stone-900">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {[currentYear, currentYear - 1, currentYear + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
          <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">{error}</p>
          {error.includes("migrations") && (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="underline">Supabase SQL Editor</a> → run <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">001_initial_schema.sql</code> then <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">002_study_threads_and_extensions.sql</code> from the supabase/migrations folder.
            </p>
          )}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : "Continue"}
      </Button>
    </form>
  );
}
