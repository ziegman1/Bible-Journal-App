"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  GROWTH_MODE_DESCRIPTION,
  GROWTH_MODE_LABEL,
  GROWTH_MODES,
} from "@/lib/growth-mode/model";
import type { GrowthMode } from "@/lib/growth-mode/types";

type ReadingMode = "canonical" | "chronological" | "custom" | "free_reading";
type AIStyle = "concise" | "balanced" | "in-depth";

interface SettingsFormProps {
  displayName: string;
  readingMode: ReadingMode;
  journalYear: number;
  aiStyle: AIStyle;
  growthMode: GrowthMode;
  weeklyShareGoalEncounters: number;
  weeklyPrayerGoalMinutes: number;
}

export function SettingsForm({
  displayName,
  readingMode,
  journalYear,
  aiStyle,
  growthMode: initialGrowthMode,
  weeklyShareGoalEncounters,
  weeklyPrayerGoalMinutes,
}: SettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(displayName);
  const [reading, setReading] = useState<ReadingMode>(readingMode);
  const [year, setYear] = useState(journalYear);
  const [ai, setAi] = useState<AIStyle>(aiStyle);
  const [growthMode, setGrowthMode] = useState<GrowthMode>(initialGrowthMode);
  const [shareGoal, setShareGoal] = useState(String(weeklyShareGoalEncounters));
  const [prayerGoalMin, setPrayerGoalMin] = useState(String(weeklyPrayerGoalMinutes));

  const currentYear = new Date().getFullYear();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const shareN = parseInt(shareGoal, 10);
    const prayerN = parseInt(prayerGoalMin, 10);

    const result = await updateProfile({
      display_name: name,
      reading_mode: reading,
      journal_year: year,
      ai_style: ai,
      growth_mode: growthMode,
      weekly_share_goal_encounters:
        growthMode === "guided" ? undefined : Number.isFinite(shareN) ? shareN : undefined,
      weekly_prayer_goal_minutes:
        growthMode === "guided" ? undefined : Number.isFinite(prayerN) ? prayerN : undefined,
    });

    setSaving(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Settings saved");
  }

  const showRhythmGoalFields = growthMode !== "guided";

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Growth Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Growth Mode controls how much goal-setting, streak tracking, and performance-oriented
            feedback you see in BADWR.
          </p>
          <div className="space-y-2">
            <Label className="sr-only">Growth Mode</Label>
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
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white dark:bg-stone-900"
            />
          </div>
          <div className="space-y-2">
            <Label>Reading mode</Label>
            <Select value={reading} onValueChange={(v) => { if (v != null) setReading(v as ReadingMode); }}>
              <SelectTrigger className="w-full bg-white dark:bg-stone-900">
                <SelectValue />
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
            <Label>Journal year</Label>
            <Select value={String(year)} onValueChange={(v) => { if (v != null) setYear(parseInt(String(v), 10)); }}>
              <SelectTrigger className="w-full bg-white dark:bg-stone-900">
                <SelectValue />
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
          <div className="space-y-2">
            <Label>AI response style</Label>
            <Select value={ai} onValueChange={(v) => { if (v != null) setAi(v as AIStyle); }}>
              <SelectTrigger className="w-full bg-white dark:bg-stone-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="in-depth">In-depth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Weekly rhythm goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showRhythmGoalFields ? (
            <>
              <p className="text-sm text-muted-foreground">
                Targets for Share and Prayer on your dashboard and BADWR metrics (Sunday–Saturday
                week). Defaults: 5 people, 60 minutes.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="share-weekly-goal">Share goal (people per week)</Label>
                  <Input
                    id="share-weekly-goal"
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
                  <Label htmlFor="prayer-weekly-goal">Prayer goal (minutes per week)</Label>
                  <Input
                    id="prayer-weekly-goal"
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
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Guided Growth keeps numeric weekly targets out of the way on your home view. Switch to
              Intentional or Focused Growth if you want to customize share and prayer targets here.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
