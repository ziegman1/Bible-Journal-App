"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GROWTH_MODE_DESCRIPTION,
  GROWTH_MODE_LABEL,
  GROWTH_MODES,
} from "@/lib/growth-mode/model";
import type { GrowthMode } from "@/lib/growth-mode/types";
import { cn } from "@/lib/utils";

interface OnboardingFormProps {
  defaultDisplayName: string;
  defaultGrowthMode: GrowthMode;
}

export function OnboardingForm({
  defaultDisplayName,
  defaultGrowthMode,
}: OnboardingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [growthMode, setGrowthMode] = useState<GrowthMode>(defaultGrowthMode);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const journalYear = new Date().getFullYear();
    const result = await updateProfile({
      display_name: displayName,
      reading_mode: "canonical",
      journal_year: journalYear,
      growth_mode: growthMode,
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

    router.push("/start-here");
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
        <Label className="text-base">Growth Mode</Label>
        <p className="text-sm text-muted-foreground">
          You can change this anytime in Settings. Focused matches the full goals-and-streaks
          experience; Guided emphasizes tools with less on-screen tracking.
        </p>
        <div className="flex flex-col gap-2">
          {GROWTH_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setGrowthMode(m)}
              className={cn(
                "rounded-lg border p-3 text-left text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                growthMode === m
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white dark:bg-stone-900/60"
              )}
            >
              <span className="font-medium text-foreground">{GROWTH_MODE_LABEL[m]}</span>
              <p className="mt-1 text-muted-foreground">{GROWTH_MODE_DESCRIPTION[m]}</p>
            </button>
          ))}
        </div>
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
