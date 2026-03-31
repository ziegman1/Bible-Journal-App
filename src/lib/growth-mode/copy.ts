import type { GrowthCopyTone } from "@/lib/growth-mode/types";

/** CHAT + weekly needles use the same status union. */
export type PaceRhythmStatus = "ahead" | "on_pace" | "behind";

/**
 * Logged-out Share defaults to Guided (invitational) — welcoming entry point.
 * Authenticated users use their saved growth mode via {@link fetchUserGrowthPresentation}.
 */
export const ANONYMOUS_SHARE_COPY_TONE: GrowthCopyTone = "invitational";

/** Arc tick labels (default/full meter only). Guided: hidden. */
export function paceMeterArcPositionLabels(tone: GrowthCopyTone): {
  show: boolean;
  left: string;
  center: string;
  right: string;
} {
  if (tone === "invitational") {
    return { show: false, left: "", center: "", right: "" };
  }
  if (tone === "balanced") {
    return { show: true, left: "Starting", center: "Steady", right: "Growing" };
  }
  return { show: true, left: "Behind", center: "On pace", right: "Ahead" };
}

/**
 * Uppercase status line under the needle. `null` = omit entirely (Guided).
 * Ignored when parent passes a non-empty `statusHeading` (e.g. BADWR reproduction narrative).
 */
export function paceMeterRhythmHeadingLine(
  status: PaceRhythmStatus,
  tone: GrowthCopyTone
): string | null {
  if (tone === "invitational") return null;
  if (tone === "balanced") {
    if (status === "behind") return "Starting";
    if (status === "on_pace") return "Steady";
    return "Growing";
  }
  if (status === "on_pace") return "On pace";
  if (status === "ahead") return "Ahead of pace";
  return "Behind pace";
}

/** Accessible summary for the pace SVG. */
export function paceMeterSvgAriaLabel(
  tone: GrowthCopyTone,
  status: PaceRhythmStatus,
  message: string,
  ariaDescription: string,
  explicitStatusHeading?: string | null
): string {
  if (explicitStatusHeading != null && explicitStatusHeading.trim() !== "") {
    return `${explicitStatusHeading.trim()}. ${ariaDescription}`;
  }
  if (tone === "invitational") {
    return `Rhythm at a glance. ${message} ${ariaDescription}`;
  }
  const line = paceMeterRhythmHeadingLine(status, tone);
  if (line) return `${line}. ${ariaDescription}`;
  return `${message}. ${ariaDescription}`;
}

export function insightsOverviewReflectionLine(tone: GrowthCopyTone): string | null {
  if (tone === "invitational") {
    return "These simply reflect your journey so far—not a ranking or a score.";
  }
  if (tone === "balanced") {
    return "A snapshot of your journey in this period—for reflection, not comparison.";
  }
  return null;
}

export function insightsOverviewStatLabels(tone: GrowthCopyTone): {
  journal: string;
  threads: string;
  aiQuestions: string;
  books: string;
} {
  const standard = {
    journal: "Journal entries",
    threads: "Study threads",
    aiQuestions: "AI questions asked",
    books: "Books studied",
  };
  if (tone === "invitational") {
    return {
      journal: "Moments recorded",
      threads: "Ongoing reflections",
      aiQuestions: "Questions you explored",
      books: "Books studied",
    };
  }
  return standard;
}

/** Tone down pace / needle messages for non-focused modes. */
export function paceMessageForTone(message: string, tone: GrowthCopyTone): string {
  if (tone === "accountability") return message;
  let m = message;
  if (tone === "balanced") {
    m = m.replace(/\bbehind pace this week\b/gi, "room in your rhythm this week");
    m = m.replace(/\bahead of pace this week\b/gi, "ahead of your weekly rhythm");
    m = m.replace(/\bbehind pace\b/gi, "room to grow this week");
    m = m.replace(/\bahead of pace\b/gi, "ahead of your weekly rhythm");
    m = m.replace(/\bon pace toward\b/gi, "in rhythm toward");
  } else {
    m = m.replace(/\bbehind pace this week\b/gi, "there’s space to continue when you’re ready");
    m = m.replace(/\bahead of pace this week\b/gi, "you have extra margin this week");
    m = m.replace(/\bbehind pace\b/gi, "there’s space to keep going when you’re ready");
    m = m.replace(/\bahead of pace\b/gi, "you’ve extra margin this week");
    m = m.replace(/\bon pace toward\b/gi, "moving toward");
  }
  return m;
}

/** CHAT / shared reading plan messages (`lib/chat-soaps/reading-pace`). */
export function readingPaceMessageForTone(message: string, tone: GrowthCopyTone): string {
  if (tone === "accountability") return message;
  if (/on pace with your group's reading plan/i.test(message)) {
    return tone === "balanced"
      ? "You're in rhythm with your group's reading plan."
      : "Your reading lines up with what your group agreed together.";
  }
  const behind = message.match(/^You are (\d+) (\w+) behind pace\.$/i);
  if (behind) {
    const [, n, unit] = behind;
    return tone === "balanced"
      ? `About ${n} ${unit} before this week's expected reading—steady steps still matter.`
      : `When you're ready, you can keep reading—about ${n} ${unit} before the shared weekly rhythm.`;
  }
  const ahead = message.match(/^You are (\d+) (\w+) ahead of pace\.$/i);
  if (ahead) {
    const [, n, unit] = ahead;
    return tone === "balanced"
      ? `You're a little ahead—about ${n} ${unit} beyond this week's plan.`
      : `You have gentle margin—about ${n} ${unit} beyond the group's rhythm this week.`;
  }
  return message;
}

export function shareToolPageIntro(tone: GrowthCopyTone, goalPhrase: string): string {
  if (tone === "accountability") {
    return `Log each gospel or testimony conversation. Your dashboard shows weekly pace (goal: ${goalPhrase}) and how people responded—red, yellow, green, or already a Christian.`;
  }
  if (tone === "balanced") {
    return `Log each gospel or testimony conversation. You'll see a light weekly rhythm on your dashboard (around ${goalPhrase}) and how people responded—red, yellow, green, or already a Christian.`;
  }
  return `Log gospel or testimony conversations when you're ready, in your own words. You can note how someone responded—full tools and optional rhythm views stay on your dashboard.`;
}

export function shareLogSheetDescription(
  tone: GrowthCopyTone,
  weeklyShareGoalEncounters: number
): string {
  const goalPhrase =
    weeklyShareGoalEncounters === 1
      ? "one person"
      : `${weeklyShareGoalEncounters} people`;
  if (tone === "accountability") {
    return `Record a gospel or testimony conversation. Each log counts toward your weekly goal of ${goalPhrase}.`;
  }
  if (tone === "balanced") {
    return `Record a gospel or testimony conversation. If you use weekly rhythms, this also updates your gentle pacing view (around ${goalPhrase} per week).`;
  }
  return `Record a gospel or testimony conversation. This is a simple journal of what God is doing—no scorekeeping on this screen.`;
}

export function shareSaveSuccessMessage(tone: GrowthCopyTone): string {
  if (tone === "accountability") {
    return "Share saved. It counts toward this week’s pace on your dashboard.";
  }
  if (tone === "balanced") {
    return "Saved. It's in your log and updates your light weekly rhythm if you use that view.";
  }
  return "Saved. Thank you for noting this conversation.";
}

/** Primary CTA to open the share sheet. */
export function shareLogOpenButtonLabel(tone: GrowthCopyTone): string {
  if (tone === "invitational") return "Note a conversation";
  return "Log a share";
}

export function shareLogSheetTitle(tone: GrowthCopyTone): string {
  if (tone === "invitational") return "Record a conversation";
  return "Log a share";
}

export function prayerToolPageIntro(tone: GrowthCopyTone): string {
  const core =
    "A guided hour with God, broken into twelve equal parts—praise, waiting, confession, Scripture, petition, intercession, praying the Word, thanksgiving, singing, meditation, listening, and closing praise. Choose how long each part runs";
  if (tone === "accountability") {
    return `${core}; your completed segments add to this week's prayer time on the dashboard (Sunday–Saturday in your time zone). You can also log extra prayer time below in 5-minute blocks.`;
  }
  if (tone === "balanced") {
    return `${core}. Completed time can appear in your light weekly rhythm on the home screen (Sunday–Saturday in your time zone). You can also log extra prayer time below in 5-minute blocks.`;
  }
  return `${core}. Take it at the pace that fits today—you can also log extra prayer time below in 5-minute blocks when that helps.`;
}

export function prayerWheelCompleteCopy(tone: GrowthCopyTone, totalMinutes: number): string {
  if (tone === "accountability") {
    return `You finished all twelve segments (${totalMinutes} minutes). Your time is counted toward this week's prayer stats on the home dashboard (Sun–Sat in your time zone).`;
  }
  if (tone === "balanced") {
    return `You finished all twelve segments (${totalMinutes} minutes). That time can show up in your gentle weekly rhythm on the home screen if you use it.`;
  }
  return `You finished all twelve segments (${totalMinutes} minutes). Rest in that—and come back whenever you want another hour with God.`;
}

export function prayerWheelSaveErrorWeeklyHint(tone: GrowthCopyTone): string {
  if (tone === "accountability") {
    return "Continue without saving keeps your prayer flow going; that segment won't count toward weekly stats until the database is set up.";
  }
  if (tone === "balanced") {
    return "Continue without saving keeps your prayer going; logging can resume once the database is ready.";
  }
  return "Continue without saving keeps your prayer time uninterrupted—you can sync logs later once the database is ready.";
}

export function extraPrayerFormDescription(tone: GrowthCopyTone): string {
  if (tone === "accountability") {
    return "Log other prayer outside the wheel in 5-minute steps. It adds to the same weekly total as the Prayer Wheel on your dashboard.";
  }
  if (tone === "balanced") {
    return "Log other prayer outside the wheel in 5-minute steps. It appears with your Prayer Wheel time in your weekly rhythm on the home screen.";
  }
  return "Log other prayer outside the wheel in 5-minute steps—just for your own record and rhythm.";
}

export function extraPrayerSaveSuccess(tone: GrowthCopyTone, minutes: number): string {
  if (tone === "accountability") {
    return `Saved ${minutes} minutes toward this week’s prayer total.`;
  }
  if (tone === "balanced") {
    return `Saved ${minutes} minutes toward your weekly prayer rhythm.`;
  }
  return `Saved ${minutes} minutes of prayer time.`;
}

export function resetWeekPrayerSectionCopy(tone: GrowthCopyTone): {
  title: string;
  body: string;
  buttonLabel: string;
  confirmTitle: string;
  confirmDescription: string;
} {
  if (tone === "accountability") {
    return {
      title: "Reset this week",
      body: "Clear all Prayer Wheel segments and extra minutes logged for the current practice week (Sunday–Saturday in your device timezone). Your dashboard prayer total will go back to zero for this week. This cannot be undone.",
      buttonLabel: "Reset this week's prayer time",
      confirmTitle: "Reset this week’s prayer time?",
      confirmDescription:
        "This removes every Prayer Wheel completion and every extra-minute entry for the current practice week (your device timezone). Past weeks are not affected.",
    };
  }
  if (tone === "balanced") {
    return {
      title: "Reset this week",
      body: "Clear Prayer Wheel segments and extra minutes for the current practice week (Sunday–Saturday in your device timezone). Your weekly prayer view on the home screen will show zero for this week. This cannot be undone.",
      buttonLabel: "Reset this week's logged prayer time",
      confirmTitle: "Reset this week’s logged prayer time?",
      confirmDescription:
        "This clears Prayer Wheel and extra-minute logs for the current practice week only (your device timezone). Past weeks stay as they are.",
    };
  }
  return {
    title: "Start this week’s log fresh",
    body: "If your log doesn’t match real life, you can clear Prayer Wheel segments and extra minutes for the current practice week (Sunday–Saturday in your device timezone). Past weeks stay unchanged. This cannot be undone.",
    buttonLabel: "Clear this week’s logged prayer time",
    confirmTitle: "Clear this week’s prayer log?",
    confirmDescription:
      "This removes Prayer Wheel completions and extra-minute entries for the current practice week only (your device timezone). It helps the tool reflect the week you want to remember.",
  };
}

export function badwrReproductionHeading(
  overallPercent: number,
  tone: GrowthCopyTone
): { heading: string; paceStatus: "ahead" | "on_pace" | "behind" } {
  if (overallPercent >= 78) {
    return { heading: "Strong reproduction rhythm", paceStatus: "ahead" };
  }
  if (overallPercent >= 52) {
    return {
      heading:
        tone === "accountability"
          ? "Building toward reproduction"
          : "Growing your reproduction rhythm",
      paceStatus: "on_pace",
    };
  }
  return {
    heading:
      tone === "accountability"
        ? "Rhythms need attention"
        : tone === "balanced"
          ? "Room to grow in your rhythms"
          : "Keep inviting your next step",
    paceStatus: "behind",
  };
}

export function badwrCombinedMessage(overallPercent: number, tone: GrowthCopyTone): string {
  if (tone === "accountability") {
    return `${overallPercent}% average reproduction health (all pillars combined, cumulative).`;
  }
  if (tone === "balanced") {
    return `${overallPercent}% average across your Word, prayer, CHAT, 3/3rds, and share rhythms (cumulative).`;
  }
  return `Your practices over time across Word, prayer, CHAT, 3/3rds, and share—about ${overallPercent}% of the combined rhythm so far.`;
}

export function chatReadingPaceCardDescription(tone: GrowthCopyTone): string {
  if (tone === "accountability") {
    return "Compared to your group's daily chapter goal and start date, using your SOAPS bookmark in the reader.";
  }
  if (tone === "balanced") {
    return "How your SOAPS bookmark lines up with the reading plan your group chose.";
  }
  return "Your SOAPS bookmark relative to the plan your group agreed on—support for reading together, not a score.";
}

export function insightsPageSubtitle(tone: GrowthCopyTone): string {
  const rangeHint =
    "Counts use each entry's date; widen the range or choose All time if a section looks empty.";
  if (tone === "accountability") {
    return `A reflection on your journaling journey. ${rangeHint}`;
  }
  if (tone === "balanced") {
    return `A relaxed look back at your journaling. ${rangeHint}`;
  }
  return `Notice themes God may be shaping in your reflections. ${rangeHint}`;
}

export function insightsJournalingEmptyCopy(tone: GrowthCopyTone): string {
  if (tone === "accountability") return "No journal entries in this period.";
  if (tone === "balanced") {
    return "No journal entries in this range—try widening the dates or jotting a short reflection to begin.";
  }
  return "This is a fine place to start—widen the dates or add an entry when you're ready. There's no rush.";
}

export function insightsThemesEmptyCopy(tone: GrowthCopyTone): string {
  if (tone === "accountability") {
    return "No tags used in this period. Add tags to journal entries to see themes here.";
  }
  if (tone === "balanced") {
    return "No tags in this range—tags on entries help themes gather here over time.";
  }
  return "Tags are optional. When you use them on entries, themes can surface here naturally.";
}

export function insightsBooksEmptyCopy(tone: GrowthCopyTone): string {
  if (tone === "accountability") return "No book or passage data in this period.";
  if (tone === "balanced") {
    return "No book or passage highlights in this range—try a wider window or keep journaling.";
  }
  return "As you journal with Scripture, this view fills in. For now, consider it an open space.";
}

export function insightsKeywordsEmptyCopy(tone: GrowthCopyTone): string {
  if (tone === "accountability") {
    return "No reflection, prayer, or application text in this period.";
  }
  if (tone === "balanced") {
    return "Not enough journal body text in this range for repeated words yet.";
  }
  return "Repeated words appear as you write in reflections and prayers—optional and unhurried.";
}

export function insightsAiSummaryIdleCopy(tone: GrowthCopyTone): string {
  if (tone === "accountability") {
    return "Generate an AI-powered summary of your journaling journey. This uses your reflections, prayers, applications, and study threads to create a reflective synthesis.";
  }
  if (tone === "balanced") {
    return "Generate a gentle AI reflection from your entries—reflections, prayers, applications, and study threads woven together.";
  }
  return "If you want a bird's-eye reflection, you can ask for a summary—optional, and only from what you already wrote.";
}
