/** Gen Map health matrix: stable ids for `<use href="#…">` + labels for a11y. Order = row-major 3×4. */
export const GEN_MAP_HEALTH_ICON_CELLS = [
  { id: "gen-map-health-gospel", label: "Gospel" },
  { id: "gen-map-health-repent", label: "Repent" },
  { id: "gen-map-health-baptism", label: "Baptism" },
  { id: "gen-map-health-holy-spirit", label: "Holy Spirit" },
  { id: "gen-map-health-gods-word", label: "God's Word" },
  { id: "gen-map-health-love", label: "Love" },
  { id: "gen-map-health-lords-supper", label: "Lord's Supper" },
  { id: "gen-map-health-prayer", label: "Prayer" },
  { id: "gen-map-health-signs", label: "Signs & Wonders" },
  { id: "gen-map-health-giving", label: "Giving" },
  { id: "gen-map-health-worship", label: "Worship" },
  { id: "gen-map-health-multiplication", label: "Fellowship / Multiplication" },
] as const;

export type GenMapHealthIconCell = (typeof GEN_MAP_HEALTH_ICON_CELLS)[number];

export const GEN_MAP_HEALTH_ICON_COUNT = GEN_MAP_HEALTH_ICON_CELLS.length;
