"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  agreeToChatProposal,
  proposeChatGroupPlan,
} from "@/app/actions/chat-groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Circle } from "lucide-react";

export type ChatGroupWorkspaceClient = {
  group: {
    id: string;
    name: string;
    chat_weekday: number | null;
    chat_meeting_time_text: string | null;
    chat_reading_plan: string | null;
  };
  pendingProposal: {
    id: string;
    weekday: number;
    meeting_time_text: string;
    reading_plan: string;
    proposed_by_user_id: string;
  } | null;
  activeProposal: {
    id: string;
    weekday: number;
    meeting_time_text: string;
    reading_plan: string;
  } | null;
  agreements: { user_id: string; agreed: boolean }[];
  memberCount: number;
  members: { userId: string; displayName: string }[];
  weekdayLabels: readonly string[];
};

function weekdayLabel(labels: readonly string[], n: number | null | undefined) {
  if (n == null || !Number.isInteger(n) || n < 0 || n > 6) return "—";
  return labels[n] ?? "—";
}

export function ChatGroupPlanSection({
  groupId,
  currentUserId,
  workspace,
}: {
  groupId: string;
  currentUserId: string;
  workspace: ChatGroupWorkspaceClient;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [weekday, setWeekday] = useState<string>("1");
  const [timeText, setTimeText] = useState("");
  const [readingPlan, setReadingPlan] = useState("");

  const agreed = useMemo(() => {
    const m = new Map<string, boolean>();
    workspace.agreements.forEach((a) => m.set(a.user_id, a.agreed));
    return m;
  }, [workspace.agreements]);

  const hasAgreed =
    workspace.pendingProposal && agreed.get(currentUserId) === true;

  const activeWeekday =
    workspace.group.chat_weekday ??
    workspace.activeProposal?.weekday ??
    null;
  const activeTime =
    workspace.group.chat_meeting_time_text ??
    workspace.activeProposal?.meeting_time_text ??
    null;
  const activePlan =
    workspace.group.chat_reading_plan ??
    workspace.activeProposal?.reading_plan ??
    null;

  const onPropose = () => {
    setErr(null);
    const w = Number.parseInt(weekday, 10);
    startTransition(async () => {
      const out = await proposeChatGroupPlan(groupId, w, timeText, readingPlan);
      if ("error" in out) {
        setErr(out.error ?? "Something went wrong");
        return;
      }
      setTimeText("");
      setReadingPlan("");
      router.refresh();
    });
  };

  const onAgree = (proposalId: string) => {
    setErr(null);
    startTransition(async () => {
      const out = await agreeToChatProposal(proposalId, groupId);
      if ("error" in out) {
        setErr(out.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {err && (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      )}

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-foreground">Agreed schedule & reading</CardTitle>
          <CardDescription className="text-muted-foreground">
            When everyone accepts a proposal, it becomes your shared plan. Any member can
            propose a new one; previous pending proposals are replaced.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-2 text-sm">
          {activePlan ? (
            <>
              <p>
                <span className="text-muted-foreground">Weekly meeting: </span>
                <span className="text-foreground font-medium">
                  {weekdayLabel(workspace.weekdayLabels, activeWeekday)}
                  {activeTime ? ` · ${activeTime}` : ""}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Reading plan: </span>
                <span className="text-foreground whitespace-pre-wrap">{activePlan}</span>
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              No agreed plan yet. Propose a day, time, and reading plan below; each member
              must agree.
            </p>
          )}
        </CardContent>
      </Card>

      {workspace.pendingProposal && (
        <Card className="border-amber-200/80 dark:border-amber-900/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Pending proposal</CardTitle>
            <CardDescription>
              All {workspace.memberCount} member
              {workspace.memberCount !== 1 ? "s" : ""} must agree before this becomes
              active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">When: </span>
                {weekdayLabel(
                  workspace.weekdayLabels,
                  workspace.pendingProposal.weekday
                )}
                {workspace.pendingProposal.meeting_time_text
                  ? ` · ${workspace.pendingProposal.meeting_time_text}`
                  : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Reading: </span>
                <span className="whitespace-pre-wrap">
                  {workspace.pendingProposal.reading_plan}
                </span>
              </p>
            </div>
            <ul className="space-y-2">
              {workspace.members.map((m) => {
                const ok = agreed.get(m.userId) === true;
                return (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    {ok ? (
                      <Check className="size-4 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground shrink-0" />
                    )}
                    <span>
                      {m.displayName}
                      {m.userId === currentUserId ? " (you)" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
            {!hasAgreed && (
              <Button
                onClick={() => onAgree(workspace.pendingProposal!.id)}
                disabled={pending}
              >
                I agree to this plan
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-foreground">Propose day, time & reading</CardTitle>
          <CardDescription className="text-muted-foreground">
            Describe when you will meet and what you will read (for example: “Ephesians 5x
            this week” or “1 Samuel, ch. 1–15”).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chat-weekday">Day of the week</Label>
            <Select
              value={weekday}
              onValueChange={(v) => setWeekday(v ?? "1")}
            >
              <SelectTrigger id="chat-weekday" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workspace.weekdayLabels.map((label, i) => (
                  <SelectItem key={label} value={String(i)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chat-time">Time (text is fine)</Label>
            <Input
              id="chat-time"
              placeholder="e.g. 7:00 p.m. Eastern"
              value={timeText}
              onChange={(e) => setTimeText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chat-plan">Bible reading plan</Label>
            <Textarea
              id="chat-plan"
              rows={4}
              placeholder="What will the group read or focus on each week?"
              value={readingPlan}
              onChange={(e) => setReadingPlan(e.target.value)}
            />
          </div>
          <Button onClick={onPropose} disabled={pending}>
            Submit proposal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
