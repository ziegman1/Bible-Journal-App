/**
 * Gen Map health matrix — sprite ids + labels (`health-icon-cells.ts`);
 * geometry lives in `GenMapHealthIconSpriteDefs` (inline `<symbol>`s).
 */
export {
  GEN_MAP_HEALTH_ICON_CELLS,
  GEN_MAP_HEALTH_ICON_COUNT,
  type GenMapHealthIconCell,
} from "./health-icon-cells";

/** Legacy export name used by earlier code paths. */
export { GEN_MAP_HEALTH_ICON_CELLS as GEN_MAP_HEALTH_ICON_DEFS } from "./health-icon-cells";
