"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type ReadingMode = "canonical" | "chronological" | "custom" | "free_reading";
type AIStyle = "concise" | "balanced" | "in-depth";

interface SettingsFormProps {
  displayName: string;
  readingMode: ReadingMode;
  journalYear: number;
  aiStyle: AIStyle;
  weeklyShareGoalEncounters: number;
  weeklyPrayerGoalMinutes: number;
}

export function SettingsForm({
  displayName,
  readingMode,
  journalYear,
  aiStyle,
  weeklyShareGoalEncounters,
  weeklyPrayerGoalMinutes,
}: SettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(displayName);
  const [reading, setReading] = useState<ReadingMode>(readingMode);
  const [year, setYear] = useState(journalYear);
  const [ai, setAi] = useState<AIStyle>(aiStyle);
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
      weekly_share_goal_encounters: Number.isFinite(shareN) ? shareN : undefined,
      weekly_prayer_goal_minutes: Number.isFinite(prayerN) ? prayerN : undefined,
    });

    setSaving(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Settings saved");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
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
          <p className="text-sm text-muted-foreground">
            Targets for Share and Prayer on your dashboard and BADWR metrics (Sunday–Saturday week).
            Defaults: 5 people, 60 minutes.
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
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
