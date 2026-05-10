import Link from "next/link";
import { redirect } from "next/navigation";
import { getSoapsHomeActionHref } from "@/app/actions/soaps-home-action";
import {
  GuidedJourneyAdminDebugPanel,
  type GuidedJourneyAdminDebugSnapshot,
} from "@/components/journey/guided-journey-admin-debug-panel";
import { GuidedLessonStep } from "@/components/journey/guided-lesson-step";
import { GuidedSoapsRestPanel } from "@/components/journey/guided-soaps-rest-panel";
import { GuidedSoapsStep } from "@/components/journey/guided-soaps-step";
import { JourneyCelebrateBanner } from "@/components/journey/journey-celebrate-banner";
import { JourneyProgressHeader } from "@/components/journey/journey-progress-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getLessonDocForStep } from "@/content/guided-journey/lesson-docs";
import {
  getActiveLinearStep,
  getDisplayLinearStepIndex,
  isGuidedJourneySoapsRestPeriod,
  countSentGuidedJourneyInvites,
  isLinearDiscipleshipPathGraduated,
  isLinearDiscipleshipStepKey,
  isSpiritualBreathingInviteGatherActive,
  LINEAR_DISCIPLESHIP_STEP_COUNT,
  type LinearDiscipleshipStepDef,
  type LinearDiscipleshipPathV1,
  type LinearSoapsJourneyStepKey,
} from "@/lib/app-experience-mode/linear-discipleship-path";
import { parseJourneyProgress } from "@/lib/app-experience-mode/journey-progress";
import {
  getTransitionMessageAfterStep,
  isCelebrationFromParamValid,
} from "@/lib/guided-journey/journey-transitions";
import { journeyStepProgressUi } from "@/lib/guided-journey/journey-step-ui";
import { normalizeAppExperienceMode } from "@/lib/app-experience-mode/model";
import {
  guidedSoapsReadyForComplete,
  guidedSoapsReadyForShare,
  type LatestSoapsFieldsRow,
} from "@/lib/guided-journey/latest-soaps-readiness";
import { createClient } from "@/lib/supabase/server";
import {
  isGuidedJourneyAdminUser,
  isGuidedJourneyDelayBypassed,
  isGuidedJourneyFeatureEnabled,
} from "@/lib/guided-journey/guided-journey-access";

function adminDebugSnapshot(
  linear: LinearDiscipleshipPathV1 | null | undefined,
  active: LinearDiscipleshipStepDef | null,
  displayStepIndex: number
): GuidedJourneyAdminDebugSnapshot {
  return {
    activeStepKey: active?.key ?? null,
    displayStepIndex,
    completedKeys: linear ? [...linear.completedKeys] : [],
    stepCompletedAt: linear?.stepCompletedAt ? { ...linear.stepCompletedAt } : {},
    sentInviteCount: linear ? countSentGuidedJourneyInvites(linear) : 0,
    delayBypassed: isGuidedJourneyDelayBypassed(),
    journeyEnabledForPublic: isGuidedJourneyFeatureEnabled(),
  };
}

export default async function JourneyHomePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user || !supabase) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("app_experience_mode, journey_progress")
    .eq("id", user.id)
    .maybeSingle();

  const mode = normalizeAppExperienceMode(profile?.app_experience_mode);
  if (mode != null && mode !== "journey") {
    redirect("/app");
  }
  if (mode !== "journey") {
    redirect("/app");
  }

  const jp = parseJourneyProgress(profile?.journey_progress);
  const linear = jp.linearDiscipleshipPath;
  const soapsAction = await getSoapsHomeActionHref();
  const showAdminPanel = isGuidedJourneyAdminUser(user);

  if (!linear || isLinearDiscipleshipPathGraduated(linear)) {
    const adminSnap = adminDebugSnapshot(linear, null, LINEAR_DISCIPLESHIP_STEP_COUNT);
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
        <div>
          <h1 className="font-serif text-2xl font-light text-stone-800 dark:text-stone-200">
            Guided Journey
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your dashboard shows the tools available in Guided Journey for this season. If you just
            finished all six steps, welcome to the next rhythm—keep meeting God in the Word and walking
            in obedience.
          </p>
        </div>
        <Link href="/app" className={cn(buttonVariants({ variant: "default" }), "inline-flex min-h-11")}>
          Open dashboard
        </Link>
        {showAdminPanel ? <GuidedJourneyAdminDebugPanel snapshot={adminSnap} /> : null}
      </div>
    );
  }

  if (isSpiritualBreathingInviteGatherActive(linear)) {
    redirect("/app/journey/invite");
  }

  const active = getActiveLinearStep(linear);
  if (!active) {
    const adminSnap = adminDebugSnapshot(linear, null, 0);
    return (
      <div className="mx-auto max-w-lg p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">Loading journey…</p>
        {showAdminPanel ? <GuidedJourneyAdminDebugPanel snapshot={adminSnap} /> : null}
      </div>
    );
  }

  const soapsRest = isGuidedJourneySoapsRestPeriod(linear);
  const displayStepIndex = getDisplayLinearStepIndex(linear);
  const progress = journeyStepProgressUi(active, displayStepIndex, { soapsRest });
  const lessonDoc = active.kind === "lesson" ? getLessonDocForStep(active.key) : null;

  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  let celebrate: string | null = null;
  if (
    fromParam &&
    isCelebrationFromParamValid(fromParam, linear.completedKeys) &&
    isLinearDiscipleshipStepKey(fromParam)
  ) {
    celebrate = getTransitionMessageAfterStep(fromParam);
  }

  const soapsShareChannelRecorded =
    active.kind === "soaps" &&
    (active.key === "soaps_1" || active.key === "soaps_2" || active.key === "soaps_3")
      ? linear.linearSoapsShareIntent?.[active.key as LinearSoapsJourneyStepKey] === true
      : false;

  let latestSoapsRow: LatestSoapsFieldsRow | null = null;
  if (
    !soapsRest &&
    active.kind === "soaps" &&
    (active.key === "soaps_1" || active.key === "soaps_2" || active.key === "soaps_3")
  ) {
    const { data, error: latestSoapsErr } = await supabase
      .from("journal_entries")
      .select("scripture_text, user_reflection, application, prayer, soaps_share")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latestSoapsErr && data) {
      latestSoapsRow = data as LatestSoapsFieldsRow;
    }
  }

  const soapsReadyForShare = guidedSoapsReadyForShare(latestSoapsRow);
  const soapsReadyForComplete = guidedSoapsReadyForComplete(latestSoapsRow);

  const adminSnap = adminDebugSnapshot(linear, active, displayStepIndex);

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-stone-50/80 via-background to-background dark:from-stone-950/50 dark:via-background dark:to-background">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
        <JourneyCelebrateBanner message={celebrate} />

        <JourneyProgressHeader active={active} progress={progress} />

        <div className="mt-10">
          {active.kind === "lesson" && lessonDoc ? (
            <GuidedLessonStep
              stepKey={active.key}
              lesson={lessonDoc}
              initialReflection={linear.lessonReflections?.[active.key]}
              sentInviteCount={countSentGuidedJourneyInvites(linear)}
              minSentInvitesRequired={active.key === "lesson_dual_accountability" ? 3 : undefined}
            />
          ) : active.kind === "soaps" &&
            (active.key === "soaps_1" || active.key === "soaps_2" || active.key === "soaps_3") ? (
            soapsRest ? (
              <GuidedSoapsRestPanel title={active.title} soapsReaderHref={soapsAction.href} />
            ) : (
              <GuidedSoapsStep
                stepKey={active.key}
                title={active.title}
                soapsReaderHref={soapsAction.href}
                soapsReadyForShare={soapsReadyForShare}
                soapsReadyForComplete={soapsReadyForComplete}
                shareChannelRecorded={soapsShareChannelRecorded}
              />
            )
          ) : (
            <p className="text-sm text-destructive">Missing lesson content for this step.</p>
          )}
        </div>
        {showAdminPanel ? <GuidedJourneyAdminDebugPanel snapshot={adminSnap} /> : null}
      </div>
    </div>
  );
}
