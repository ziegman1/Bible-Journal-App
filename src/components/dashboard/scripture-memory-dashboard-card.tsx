import { PracticeNodeCard } from "@/components/dashboard/practice-node-card";
import { getScriptureMemoryStreakSummary } from "@/app/actions/scripture-memory";

export async function ScriptureMemoryDashboardCard() {
  const { streakDays } = await getScriptureMemoryStreakSummary();
  return (
    <PracticeNodeCard
      title="SCRIPTURE"
      description="Memorize and review passages."
      statusLabel={streakDays > 0 ? `Streak: ${streakDays} day${streakDays === 1 ? "" : "s"}` : "Open"}
      href="/app/scripture-memory"
      theme="memory"
    />
  );
}
