"use client";

import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";
import { PathwayDiagramNode } from "@/components/dashboard/PathwayDiagramNode";

const pathwayHand = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

/** Layout canvas = reference dimensions; nodes/connectors added incrementally. */
export const ILLUSTRATED_MAP_W = 1024;
export const ILLUSTRATED_MAP_H = 682;

/**
 * Clean pathway canvas. Add nodes, hits, and connectors step by step per product spec.
 * (Routing keys live in `badwr-pathway-routes.ts`; use `useRouter` + `Hit` when wiring links.)
 */

/** Authoring: 96 user units ≈ 1 CSS inch so positions scale with the 1024×682 viewBox. */
const MAP_UNITS_PER_IN = 96;

/** ME anchor: started at canvas center, then nudged for layout (reproducible). */
const ME_NODE_CX_BASE = 512;
const ME_NODE_CY_BASE = 330;
/** Move ME left 2¼″ total (1½″ + ¾″) and up ¾″ (see MAP_UNITS_PER_IN). */
const ME_OFFSET_LEFT_IN = 2.25;
const ME_OFFSET_UP_IN = 0.75;
const ME_NUDGE_DOWN_IN = 0.5;
/** Applied only to the ME oval — other nodes stay keyed off `ME_NODE_CX` */
const ME_NUDGE_LEFT_IN = 0.2;

/** Map layout anchor (CHAT / PRAYER / SOAPS / Family use this, not ME-only nudges) */
const ME_NODE_CX = ME_NODE_CX_BASE - ME_OFFSET_LEFT_IN * MAP_UNITS_PER_IN;
const ME_NODE_CY =
  ME_NODE_CY_BASE - ME_OFFSET_UP_IN * MAP_UNITS_PER_IN + ME_NUDGE_DOWN_IN * MAP_UNITS_PER_IN;

const ME_NODE_VISUAL_CX = ME_NODE_CX - ME_NUDGE_LEFT_IN * MAP_UNITS_PER_IN;
/** ME diagram size (must match `PathwayDiagramNode` defaults used for id me) */
const ME_DIAGRAM_W = 120;
const ME_DIAGRAM_H = 130;
/** HTML label below ME oval (not inside the node SVG) */
const BADWR_GAP_BELOW_ME_OVAL_PX = 30;
const BADWR_LABEL_TOP_Y = ME_NODE_CY + ME_DIAGRAM_H / 2 + BADWR_GAP_BELOW_ME_OVAL_PX;

/** WATCH: 110×100 green oval, light downward tilt (label stays level); 140px right, 160px below ME visual center */
const WATCH_NODE_W = 110;
const WATCH_NODE_H = 100;
const WATCH_OFFSET_RIGHT_OF_ME_PX = 140;
const WATCH_OFFSET_BELOW_ME_PX = 160;
const WATCH_NODE_CX = ME_NODE_VISUAL_CX + WATCH_OFFSET_RIGHT_OF_ME_PX;
const WATCH_NODE_CY = ME_NODE_CY + WATCH_OFFSET_BELOW_ME_PX;
/** Positive = clockwise → oval reads as tilting slightly down to the right */
const WATCH_SHAPE_ROTATION_DEG = 22;

/** PRAYER: 100×90 oval, darker pastel blue than ME; near top of canvas, slightly left of ME */
const PRAYER_NODE_W = 100;
const PRAYER_NODE_H = 90;
const PRAYER_NUDGE_LEFT_PX = 26;
/** Inset from viewBox top (y=0) to top of oval — keeps node just inside canvas */
const PRAYER_TOP_INSET_PX = 12;
const PRAYER_NUDGE_DOWN_IN = 0.3;
const PRAYER_NODE_CX = ME_NODE_CX - PRAYER_NUDGE_LEFT_PX;
const PRAYER_NODE_CY =
  PRAYER_TOP_INSET_PX + PRAYER_NODE_H / 2 + PRAYER_NUDGE_DOWN_IN * MAP_UNITS_PER_IN;

/** SHARE: 120×100 oval, dark pastel yellow; 200px right of PRAYER (center-to-center), same vertical as PRAYER */
const SHARE_NODE_W = 120;
const SHARE_NODE_H = 100;
const SHARE_OFFSET_RIGHT_OF_PRAYER_PX = 200;
const SHARE_NUDGE_LEFT_PX = 20;
const SHARE_NODE_CX = PRAYER_NODE_CX + SHARE_OFFSET_RIGHT_OF_PRAYER_PX - SHARE_NUDGE_LEFT_PX;
const SHARE_NODE_CY = PRAYER_NODE_CY;

/** Model/Assist: 100×110 oval, pastel red; 200px below SHARE, 25px left of SHARE (center-to-center / offset) */
const MODEL_ASSIST_NODE_W = 100;
const MODEL_ASSIST_NODE_H = 110;
const MODEL_ASSIST_BELOW_SHARE_PX = 200;
const MODEL_ASSIST_LEFT_OF_SHARE_PX = 25;
const MODEL_ASSIST_NUDGE_RIGHT_PX = 80;
const MODEL_ASSIST_NODE_CX =
  SHARE_NODE_CX - MODEL_ASSIST_LEFT_OF_SHARE_PX + MODEL_ASSIST_NUDGE_RIGHT_PX;
const MODEL_ASSIST_NODE_CY = SHARE_NODE_CY + MODEL_ASSIST_BELOW_SHARE_PX;

/** Transformed Person: 250×50 oval, pastel orange; offset from Model/Assist + nudges */
const TRANSFORMED_NODE_W = 250;
const TRANSFORMED_NODE_H = 50;
const TRANSFORMED_BELOW_MODEL_ASSIST_PX = 80;
const TRANSFORMED_RIGHT_OF_MODEL_ASSIST_PX = 100;
const TRANSFORMED_NUDGE_DOWN_PX = 200;
const TRANSFORMED_NUDGE_UP_PX = 80;
const TRANSFORMED_NUDGE_RIGHT_PX = 200;
/** Moves TP + transformed CHAT + green SHARE + PRAY + transformed SOAPS together (up = smaller CY) */
const TRANSFORMED_BLOCK_NUDGE_UP_IN = 0.6;
const TRANSFORMED_NODE_CX =
  MODEL_ASSIST_NODE_CX + TRANSFORMED_RIGHT_OF_MODEL_ASSIST_PX + TRANSFORMED_NUDGE_RIGHT_PX;
const TRANSFORMED_NODE_CY =
  MODEL_ASSIST_NODE_CY +
  TRANSFORMED_BELOW_MODEL_ASSIST_PX +
  TRANSFORMED_NUDGE_DOWN_PX -
  TRANSFORMED_NUDGE_UP_PX -
  TRANSFORMED_BLOCK_NUDGE_UP_IN * MAP_UNITS_PER_IN;

/** CHAT (under Transformed Person): 50×60 purple; below TP right area, ~½″ gap from TP bottom edge */
const TRANSFORMED_CHAT_W = 50;
const TRANSFORMED_CHAT_H = 60;
const TRANSFORMED_CHAT_GAP_BELOW_IN = 0.5;
/** Shift east from TP center so the small oval sits under the right side of the bar */
const TRANSFORMED_CHAT_OFFSET_RIGHT_PX = 82;
const TRANSFORMED_CHAT_CX = TRANSFORMED_NODE_CX + TRANSFORMED_CHAT_OFFSET_RIGHT_PX;
const TRANSFORMED_CHAT_CY =
  TRANSFORMED_NODE_CY +
  TRANSFORMED_NODE_H / 2 +
  TRANSFORMED_CHAT_GAP_BELOW_IN * MAP_UNITS_PER_IN +
  TRANSFORMED_CHAT_H / 2;

/** PRAY: 46×56 (hair smaller than TP CHAT 50×60), purple, −45° tilt; ½″ from TP bottom-right along diagonal SE */
const PRAY_NODE_W = 46;
const PRAY_NODE_H = 56;
const PRAY_GAP_FROM_TP_BOTTOM_RIGHT_IN = 0.5;
const TP_BOTTOM_RIGHT_X = TRANSFORMED_NODE_CX + TRANSFORMED_NODE_W / 2;
const TP_BOTTOM_RIGHT_Y = TRANSFORMED_NODE_CY + TRANSFORMED_NODE_H / 2;
const PRAY_GAP_PX = PRAY_GAP_FROM_TP_BOTTOM_RIGHT_IN * MAP_UNITS_PER_IN;
const PRAY_DIAG_OFFSET = PRAY_GAP_PX / Math.SQRT2;
const PRAY_NODE_CX = TP_BOTTOM_RIGHT_X + PRAY_DIAG_OFFSET;
const PRAY_NODE_CY = TP_BOTTOM_RIGHT_Y + PRAY_DIAG_OFFSET;

/** SOAPS (Transformed Person): 60×50 purple; 50px gap above PRAY (between node edges) */
const TRANSFORMED_SOAPS_W = 60;
const TRANSFORMED_SOAPS_H = 50;
const TRANSFORMED_SOAPS_GAP_ABOVE_PRAY_PX = 50;
const TRANSFORMED_SOAPS_NUDGE_RIGHT_PX = 10;
const TRANSFORMED_SOAPS_NUDGE_UP_PX = 10;
const TRANSFORMED_SOAPS_CX = PRAY_NODE_CX + TRANSFORMED_SOAPS_NUDGE_RIGHT_PX;
const TRANSFORMED_SOAPS_CY =
  PRAY_NODE_CY -
  PRAY_NODE_H / 2 -
  TRANSFORMED_SOAPS_GAP_ABOVE_PRAY_PX -
  TRANSFORMED_SOAPS_H / 2 -
  TRANSFORMED_SOAPS_NUDGE_UP_PX;

/** CHAT: 120×90 oval, pastel purple; 150px left of ME + extra ½″ left, slightly below ME vertically */
const CHAT_NODE_W = 120;
const CHAT_NODE_H = 90;
const CHAT_OFFSET_FROM_ME_PX = 150;
const CHAT_EXTRA_LEFT_IN = 0.5;
const CHAT_DROP_FROM_ME_PX = 14;
const CHAT_NUDGE_DOWN_IN = 0.2;
const CHAT_NODE_CX = ME_NODE_CX - CHAT_OFFSET_FROM_ME_PX - CHAT_EXTRA_LEFT_IN * MAP_UNITS_PER_IN;
const CHAT_NODE_CY = ME_NODE_CY + CHAT_DROP_FROM_ME_PX + CHAT_NUDGE_DOWN_IN * MAP_UNITS_PER_IN;

/** Second SHARE: 75×85 green, +45° (label level); below TP, just left of TP-lane CHAT (not main pathway CHAT) */
const SHARE_GREEN_W = 75;
const SHARE_GREEN_H = 85;
const SHARE_GREEN_GAP_TO_TP_CHAT_LEFT_PX = 10;
const SHARE_GREEN_BELOW_TP_PX = 20;
const SHARE_GREEN_NUDGE_LEFT_IN = 0.5;
const SHARE_GREEN_NUDGE_DOWN_IN = 0.3;
const SHARE_GREEN_NODE_CX =
  TRANSFORMED_CHAT_CX -
  TRANSFORMED_CHAT_W / 2 -
  SHARE_GREEN_GAP_TO_TP_CHAT_LEFT_PX -
  SHARE_GREEN_W / 2 -
  SHARE_GREEN_NUDGE_LEFT_IN * MAP_UNITS_PER_IN;
const SHARE_GREEN_NODE_CY =
  TRANSFORMED_NODE_CY +
  TRANSFORMED_NODE_H / 2 +
  SHARE_GREEN_BELOW_TP_PX +
  SHARE_GREEN_H / 2 +
  SHARE_GREEN_NUDGE_DOWN_IN * MAP_UNITS_PER_IN;

/** New 3/3rds: 100×90 purple oval; 1″ + ½″ left of green SHARE center; 1.25″ below TP bottom (edge gap) + half oval */
const NEW_3_3RDS_NODE_W = 100;
const NEW_3_3RDS_NODE_H = 90;
const NEW_3_3RDS_LEFT_OF_SHARE_GREEN_IN = 1;
const NEW_3_3RDS_NUDGE_LEFT_IN = 0.5;
const NEW_3_3RDS_BELOW_TP_BOTTOM_IN = 1.25;
const TRANSFORMED_PERSON_BOTTOM_Y = TRANSFORMED_NODE_CY + TRANSFORMED_NODE_H / 2;
const NEW_3_3RDS_NODE_CX =
  SHARE_GREEN_NODE_CX -
  NEW_3_3RDS_LEFT_OF_SHARE_GREEN_IN * MAP_UNITS_PER_IN -
  NEW_3_3RDS_NUDGE_LEFT_IN * MAP_UNITS_PER_IN;
const NEW_3_3RDS_NODE_CY =
  TRANSFORMED_PERSON_BOTTOM_Y +
  NEW_3_3RDS_BELOW_TP_BOTTOM_IN * MAP_UNITS_PER_IN +
  NEW_3_3RDS_NODE_H / 2;

/** My 3/3rds Family: 142×108 oval, pastel green; below CHAT (+ nudges) + position nudges */
const FAMILY_NODE_W = 142;
const FAMILY_NODE_H = 108;
const FAMILY_BELOW_CHAT_IN = 1.5;
const FAMILY_NUDGE_DOWN_IN = 0.8;
const FAMILY_NUDGE_UP_IN = 0.7;
const FAMILY_LEFT_OF_CHAT_PX = 24;
const FAMILY_NUDGE_RIGHT_IN = 0.2;
const FAMILY_NUDGE_DOWN_IN2 = 0.3;
const FAMILY_NUDGE_LEFT_IN2 = 0.3;
const FAMILY_NUDGE_RIGHT_IN2 = 0.7;
const FAMILY_NUDGE_LEFT_IN3 = 0.15;
const FAMILY_NODE_CX =
  CHAT_NODE_CX -
  FAMILY_LEFT_OF_CHAT_PX +
  FAMILY_NUDGE_RIGHT_IN * MAP_UNITS_PER_IN -
  FAMILY_NUDGE_LEFT_IN2 * MAP_UNITS_PER_IN +
  FAMILY_NUDGE_RIGHT_IN2 * MAP_UNITS_PER_IN -
  FAMILY_NUDGE_LEFT_IN3 * MAP_UNITS_PER_IN;
const FAMILY_NODE_CY =
  CHAT_NODE_CY +
  (FAMILY_BELOW_CHAT_IN + FAMILY_NUDGE_DOWN_IN - FAMILY_NUDGE_UP_IN) * MAP_UNITS_PER_IN +
  FAMILY_NUDGE_DOWN_IN2 * MAP_UNITS_PER_IN;

/** Main SOAPS: 120×70 green; above CHAT (+ nudges), 0.5″ right of CHAT then ¾″ left */
const SOAPS_NODE_W = 120;
const SOAPS_NODE_H = 70;
const SOAPS_OFFSET_ABOVE_CHAT_IN = 1.25;
const SOAPS_NUDGE_UP_IN = 0.35;
const SOAPS_OFFSET_RIGHT_OF_CHAT_IN = 0.5;
const SOAPS_NUDGE_LEFT_IN = 0.75;
const SOAPS_NODE_CX =
  CHAT_NODE_CX + SOAPS_OFFSET_RIGHT_OF_CHAT_IN * MAP_UNITS_PER_IN - SOAPS_NUDGE_LEFT_IN * MAP_UNITS_PER_IN;
const SOAPS_NODE_CY =
  CHAT_NODE_CY - (SOAPS_OFFSET_ABOVE_CHAT_IN + SOAPS_NUDGE_UP_IN) * MAP_UNITS_PER_IN;

export function BadwrPathwayIllustratedMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-visible bg-[#fdfbf7] dark:bg-zinc-950",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${ILLUSTRATED_MAP_W} ${ILLUSTRATED_MAP_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none h-full w-full max-h-full max-w-full"
        role="img"
        aria-label="Pathway map"
        style={{ fontFamily: "inherit" }}
      >
        <title>Pathway map</title>
        <rect x={0} y={0} width={ILLUSTRATED_MAP_W} height={ILLUSTRATED_MAP_H} fill="#fdfbf7" />
      </svg>

      {/* HTML overlay: diagram nodes (same aspect box as SVG, %-positioned) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(SOAPS_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(SOAPS_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="soaps"
            label="SOAPS"
            subtext="Daily"
            shape="oval"
            width={SOAPS_NODE_W}
            height={SOAPS_NODE_H}
            strokeColor="green"
          />
        </div>
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(CHAT_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(CHAT_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="chat"
            label="CHAT"
            subtext="Weekly, 1 HR"
            shape="oval"
            width={CHAT_NODE_W}
            height={CHAT_NODE_H}
            strokeColor="purple"
          />
        </div>
        <div
          className="pointer-events-auto absolute z-[9] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(SHARE_GREEN_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(SHARE_GREEN_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="share-green"
            label="SHARE"
            shape="oval"
            width={SHARE_GREEN_W}
            height={SHARE_GREEN_H}
            strokeColor="green"
            shapeRotationDeg={45}
            labelFontSize={22}
          />
        </div>
        <div
          className="pointer-events-auto absolute z-[7] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(NEW_3_3RDS_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(NEW_3_3RDS_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="new-3-3rds"
            label={"New\n3/3rds"}
            shape="oval"
            width={NEW_3_3RDS_NODE_W}
            height={NEW_3_3RDS_NODE_H}
            strokeColor="yellow-deep"
            labelFontSize={20}
          />
        </div>
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(FAMILY_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(FAMILY_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="family-3-3"
            label={"My 3/3rds\nFamily"}
            subtext="3 HR/WK"
            shape="oval"
            width={FAMILY_NODE_W}
            height={FAMILY_NODE_H}
            strokeColor="green"
            labelFontSize={22}
          />
        </div>
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(PRAYER_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(PRAYER_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="prayer"
            label="PRAYER"
            subtext="Daily"
            shape="oval"
            width={PRAYER_NODE_W}
            height={PRAYER_NODE_H}
            strokeColor="blue-deep"
            labelFontSize={21}
          />
        </div>
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(SHARE_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(SHARE_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="share"
            label="SHARE"
            shape="oval"
            width={SHARE_NODE_W}
            height={SHARE_NODE_H}
            strokeColor="yellow-deep"
          />
        </div>
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(MODEL_ASSIST_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(MODEL_ASSIST_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="model-assist"
            label={"Model\nAssist"}
            shape="oval"
            width={MODEL_ASSIST_NODE_W}
            height={MODEL_ASSIST_NODE_H}
            strokeColor="red"
            labelFontSize={19}
          />
        </div>
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(TRANSFORMED_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(TRANSFORMED_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="transformed-person"
            label="Transformed Person"
            shape="oval"
            width={TRANSFORMED_NODE_W}
            height={TRANSFORMED_NODE_H}
            strokeColor="orange"
            labelFontSize={15}
            pastelStrokeExtraPx={2}
          />
        </div>
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(ME_NODE_VISUAL_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(ME_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode idPrefix="me" width={ME_DIAGRAM_W} height={ME_DIAGRAM_H} />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute -translate-x-1/2 text-center leading-none",
            pathwayHand.className,
          )}
          style={{
            left: `${(ME_NODE_VISUAL_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(BADWR_LABEL_TOP_Y / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <span
            className="font-bold tracking-[0.08em] text-[#3d4f5c] dark:text-zinc-200"
            style={{ fontSize: "clamp(1.35rem, 2.8vw, 1.85rem)" }}
          >
            BADWR
          </span>
        </div>
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(WATCH_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(WATCH_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="watch"
            label="WATCH"
            shape="oval"
            width={WATCH_NODE_W}
            height={WATCH_NODE_H}
            strokeColor="green"
            shapeRotationDeg={WATCH_SHAPE_ROTATION_DEG}
            labelFontSize={22}
          />
        </div>
        {/* After ME so small TP CHAT paints on top and isn’t covered */}
        <div
          className="pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(TRANSFORMED_CHAT_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(TRANSFORMED_CHAT_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="transformed-chat"
            label="CHAT"
            shape="oval"
            width={TRANSFORMED_CHAT_W}
            height={TRANSFORMED_CHAT_H}
            strokeColor="purple"
            labelFontSize={14}
            pastelStrokeExtraPx={2}
          />
        </div>
        <div
          className="pointer-events-auto absolute z-[11] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(PRAY_NODE_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(PRAY_NODE_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="pray"
            label="PRAY"
            shape="oval"
            width={PRAY_NODE_W}
            height={PRAY_NODE_H}
            strokeColor="purple"
            labelFontSize={13}
            shapeRotationDeg={-45}
          />
        </div>
        <div
          className="pointer-events-auto absolute z-[12] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(TRANSFORMED_SOAPS_CX / ILLUSTRATED_MAP_W) * 100}%`,
            top: `${(TRANSFORMED_SOAPS_CY / ILLUSTRATED_MAP_H) * 100}%`,
          }}
        >
          <PathwayDiagramNode
            idPrefix="transformed-soaps"
            label="SOAPS"
            shape="oval"
            width={TRANSFORMED_SOAPS_W}
            height={TRANSFORMED_SOAPS_H}
            strokeColor="purple"
            labelFontSize={12}
          />
        </div>
      </div>
    </div>
  );
}
