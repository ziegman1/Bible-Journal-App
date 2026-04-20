/**
 * Formation momentum engine — parallel metric system (not wired to UI yet).
 * Pipeline: raw events → normalized signals → signal modifiers → contribution matrix → category scores.
 */

export type PracticeType = "soaps" | "prayer" | "memory" | "chat" | "thirds" | "share";

export type RawEvent = {
  /** Stable id for deduping (often `${source}:${rowId}`) */
  id: string;
  practiceType: PracticeType;
  /** ISO 8601 instant for ordering and recency */
  occurredAt: string;
  /**
   * Primary scalar for downstream normalization (minutes, counts, encounter weight, etc.).
   * Semantics vary by `source`; see metadata.
   */
  value: number;
  /** Origin table or logical label (e.g. `journal_entries`, `prayer_wheel_segment_completions`). */
  source: string;
  /** Practice-specific fields for modifiers / normalization (qualifying flags, counts, FKs). */
  metadata?: Record<string, unknown>;
};

/**
 * Window-scoped practice signal after aggregation (v1).
 *
 * **windowKey (primary model):** `week:YYYY-MM-DD` — pillar week (Sunday `yyyy-MM-dd` in practice TZ) for **all**
 * practices, including Scripture Memory (`memory_new` / `memory_review`). Monthly scripture UI elsewhere is unchanged.
 *
 * **subtype (optional)** — e.g. `memory_new`, `memory_review`, or omitted for aggregate practice rows.
 */
export type NormalizedSignal = {
  /** Stable id for this aggregated row */
  id: string;
  practiceType: PracticeType;
  windowKey: string;
  /** Narrower slice when one window row is split (e.g. scripture new vs review). */
  subtype?: string;
  /** Primary volume for scoring (entries, minutes, encounters, check-ins, etc.). */
  totalUnits: number;
  /** Subset that counts toward “quality” bars (e.g. qualifying SOAPS); may equal totalUnits. */
  qualifyingUnits: number;
  /** Distinct calendar days in practice TZ with any activity in this window (for consistency / rhythm). */
  daysWithActivity: number;
  /** Reserved for goal alignment (e.g. derived weekly targets); null until wired. */
  goalTarget: number | null;
  /** Extra trace for modifiers, dedupe, grace, future explainability. */
  metadata: Record<string, unknown>;
};

export type ModifierBreakdown = {
  recency: number;
  consistency: number;
  grace: number;
  goalAlignment: number;
};

/** Debug / explainability payload for the consistency modifier (see `modifiers/consistency.ts`). */
export type ConsistencyModifierMeta = {
  pattern: "daily" | "weekly" | "unknown";
  daysWithActivityUsed: number | null;
  dailyTier: number | null;
  weeklyHadActivity: boolean | null;
};

export type GoalAlignmentMode =
  | "soaps_qualifying"
  | "prayer_minutes"
  | "share_encounters"
  | "memory_new"
  | "memory_review"
  | "neutral_no_goal";

/** Debug / explainability for goal alignment (see `modifiers/goal-alignment.ts`). */
export type GoalAlignmentModifierMeta = {
  mode: GoalAlignmentMode;
  actual: number | null;
  goalTargetUsed: number | null;
  rawRatio: number | null;
};

/** Why grace adjusted this row (see `modifiers/grace.ts`). */
export type GraceReason =
  | { kind: "onboarding_window_overlap"; signupYmd: string; signalWeekStartYmd: string }
  | { kind: "partial_week_early"; pillarDayIndex: number }
  | { kind: "re_engagement"; priorWeekKey: string }
  | { kind: "none" };

export type GraceModifierMeta = {
  /** Amount of uplift from 1.0 after capping (factor = 1 + bonusApplied effectively). */
  bonusApplied: number;
  reasons: GraceReason[];
};

/**
 * Normalized signal after modifiers. v1: full modifier chain including grace.
 */
export type ModifiedSignal = NormalizedSignal & {
  /** Copy of `totalUnits` before modifier chain (for audit / UI). */
  baseValue: number;
  /** `windowKey` at modification time (same as signal unless we ever remap). */
  originalWindowKey: string;
  /** Recency multiplier from pillar-week distance (see `modifiers/recency.ts`). */
  recencyFactor: number;
  /** Whole pillar weeks ago when recency was computed (debug / explainability). */
  recencyWeeksAgo: number;
  /** Consistency multiplier (practice-aware rhythm; see `modifiers/consistency.ts`). */
  consistencyFactor: number;
  consistencyMeta: ConsistencyModifierMeta;
  /** Goal alignment multiplier (actual vs weekly / derived weekly targets). */
  goalAlignmentFactor: number;
  goalAlignmentMeta: GoalAlignmentModifierMeta;
  /** Bounded fairness multiplier (≥ 1); see `modifiers/grace.ts`. */
  graceFactor: number;
  graceMeta: GraceModifierMeta;
  /** Per-factor multipliers; see `effectiveValue`. */
  modifierBreakdown: ModifierBreakdown;
  /** `baseValue × recency × consistency × goalAlignment × grace`. */
  effectiveValue: number;
  /** Same as `effectiveValue` for matrix input (all modifiers in product). */
  effectiveWeight: number;
};

export type CategoryId = "foundation" | "formation" | "reproduction";

export type CategoryScore = {
  category: CategoryId;
  /** 0–1 or arbitrary scale; snapshot contract TBD when wired to UI */
  score: number;
};

/** Per-category mass from the contribution matrix for one signal (`effectiveWeight × matrix row`). */
export type CategoryContributionBreakdown = {
  foundation: number;
  formation: number;
  reproduction: number;
};

/**
 * One row of modifier + matrix explainability for tuning (not end-user copy).
 * Server-side / API inspection only until product defines a consumer.
 */
export type FormationMomentumSignalExplain = {
  signalId: string;
  practiceType: PracticeType;
  subtype?: string;
  windowKey: string;
  baseValue: number;
  totalUnits: number;
  qualifyingUnits: number;
  daysWithActivity: number;
  recencyFactor: number;
  consistencyFactor: number;
  goalAlignmentFactor: number;
  graceFactor: number;
  effectiveValue: number;
  effectiveWeight: number;
  categoryContribution: CategoryContributionBreakdown;
};

export type NormalizedSignalExplainSlice = Pick<
  NormalizedSignal,
  "id" | "practiceType" | "subtype" | "windowKey" | "totalUnits" | "qualifyingUnits" | "daysWithActivity"
>;

/**
 * Structured inspection payload for the v1 pipeline (tuning, tests, internal tools).
 * Omit from responses unless `explain: true` to avoid shipping large blobs by default.
 */
export type GrowthStageId = 1 | 2 | 3;

export type FormationMomentumExplain = {
  /**
   * Baseline matrix id used only to compute provisional category totals for growth-stage detection
   * (same modifier chain; does not change per-signal effective weights).
   */
  provisionalMatrixId: string;
  /** Category totals using the provisional / baseline matrix (before stage-specific split). */
  provisionalCategoryTotals: CategoryContributionBreakdown;
  /** Shares of provisional totals — inputs to {@link detectGrowthStage}. */
  provisionalShares: {
    foundation: number;
    formation: number;
    reproduction: number;
  };
  /** Resolved growth stage for this run. */
  growthStage: {
    id: GrowthStageId;
    label: string;
  };
  /**
   * Foundation-first guardrail: early users stay stage 1 until enough pillar weeks / signals exist,
   * even when provisional shares would elevate to stage 2+.
   */
  stageGuardrail?: {
    forcedToFoundation: boolean;
    reason: string | null;
    elapsedPillarWeeks: number;
    normalizedSignalCount: number;
    provisionalStageId: GrowthStageId;
  };
  /**
   * Foundation-first progression: Formation (and lightly Reproduction) are scaled until Foundation’s
   * share of provisional mass crosses `unlockThreshold` — models ordered discipleship growth (v1).
   */
  progressionGate: {
    /** Foundation ÷ sum(provisional categories) using baseline matrix — unlock progress for v1. */
    foundationProgressForUnlock: number;
    unlockThreshold: number;
    /** True when Foundation progress is still below the unlock threshold. */
    formationGated: boolean;
    /** Multiplier applied to Formation category mass after stage + sharing (1 when ungated). */
    formationGatingMultiplier: number;
    /** Multiplier applied to Reproduction mass while gated (1 when ungated). */
    reproductionGatingMultiplier: number;
  };
  /** Matrix id applied to produce final `categoryTotals` and per-signal `categoryContribution`. */
  contributionMatrixId: string;
  /**
   * Progressive sharing-only model: trailing-window consistency, override row replacing the stage
   * matrix’s share row, and optional bounded drag on share-derived mass.
   */
  sharingImpact: {
    windowPillarWeeks: number;
    weeksWithShareActivity: number;
    level: { id: 1 | 2 | 3 | 4; key: string; label: string };
    profileId: string;
    profileRow: { foundation: number; formation: number; reproduction: number };
    /** Category multipliers applied to share-derived mass only (weakness drag). */
    dragMultipliers: { foundation: number; formation: number; reproduction: number };
    /** True when any weakness drag multiplier is below 1. */
    weaknessDragApplied: boolean;
    /** True when reproduction was scaled by a drag factor below 1. */
    reproductionDragApplied: boolean;
    /** Share-only category totals before drag (for tuning). */
    shareOnlyTotalsBeforeDrag: {
      foundation: number;
      formation: number;
      reproduction: number;
    };
  };
  normalizedSignals: NormalizedSignalExplainSlice[];
  signals: FormationMomentumSignalExplain[];
  categoryTotals: CategoryContributionBreakdown;
  /** Sum of the three category totals (total “mass” through the applied matrix). */
  overallTotal: number;
};

export type ComputeFormationMomentumOptions = {
  /**
   * When true, includes `explain` on the snapshot. Intended for server-side tuning and tests —
   * not wired to consumer UI yet; can be large.
   */
  explain?: boolean;
};

export type MomentumSnapshot = {
  userId: string;
  computedAt: string;
  categories: CategoryScore[];
  /** Optional debug hooks for development */
  meta?: {
    signalCount: number;
    modifiedSignalCount: number;
    /** Growth stage from provisional category balance (same as `explain.growthStage` when explain is on). */
    growthStageId?: GrowthStageId;
    growthStageLabel?: string;
    appliedMatrixId?: string;
  };
  /** Present when `explain: true`; machine-readable scoring inspection. */
  explain?: FormationMomentumExplain;
};
