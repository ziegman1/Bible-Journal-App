"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GrowthMode } from "@/lib/growth-mode/types";

export function WeeklyRhythmGoalsForm({
  growthMode,
  weeklyShareGoalEncounters,
  weeklyPrayerGoalMinutes,
}: {
  growthMode: GrowthMode;
  weeklyShareGoalEncounters: number;
  weeklyPrayerGoalMinutes: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [shareGoal, setShareGoal] = useState(String(weeklyShareGoalEncounters));
  const [prayerGoalMin, setPrayerGoalMin] = useState(String(weeklyPrayerGoalMinutes));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showRhythmGoalFields = growthMode !== "guided";

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    const shareN = parseInt(shareGoal, 10);
    const prayerN = parseInt(prayerGoalMin, 10);

    const result = await updateProfile({
      weekly_share_goal_encounters:
        growthMode === "guided" ? undefined : Number.isFinite(shareN) ? shareN : undefined,
      weekly_prayer_goal_minutes:
        growthMode === "guided" ? undefined : Number.isFinite(prayerN) ? prayerN : undefined,
    });

    setSaving(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setMessage("Saved.");
    console.log("[BADWR DEBUG] router.refresh triggered from: src/components/share/weekly-rhythm-goals-form.tsx — #1");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-base font-normal">Weekly rhythm goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showRhythmGoalFields ? (
          <form onSubmit={(e) => void onSave(e)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Targets for Share and Prayer on your dashboard and BADWR metrics (Sunday–Saturday week).
              Defaults: 5 people, 60 minutes.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="share-weekly-goal-share-page">Share goal (people per week)</Label>
                <Input
                  id="share-weekly-goal-share-page"
                  type="number"
                  min={1}
                  max={50}
                  inputMode="numeric"
                  value={shareGoal}
                  onChange={(e) => setShareGoal(e.target.value)}
                  className="bg-white dark:bg-stone-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prayer-weekly-goal-share-page">Prayer goal (minutes per week)</Label>
                <Input
                  id="prayer-weekly-goal-share-page"
                  type="number"
                  min={5}
                  max={600}
                  step={5}
                  inputMode="numeric"
                  value={prayerGoalMin}
                  onChange={(e) => setPrayerGoalMin(e.target.value)}
                  className="bg-white dark:bg-stone-900"
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}
            <Button type="submit" disabled={saving} className="min-h-10">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Guided Growth keeps numeric weekly targets out of the way on your home view. Switch to
            Intentional or Focused Growth in Settings if you want to customize share and prayer targets
            here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
