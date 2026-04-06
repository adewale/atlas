/**
 * View Transition API — shared element transition names and helpers.
 *
 * Every `viewTransitionName` string used in the app lives here.
 * Importing from this module catches typos at build time and
 * provides a single inventory of all shared-element morphs.
 */

/* ── Transition name constants ────────────────────────────── */

export const VT = {
  /** Element symbol text (Fe, Au…) — grid/card → Folio hero */
  SYMBOL: 'element-symbol',
  /** Atomic number (026) — grid/card → Folio hero */
  NUMBER: 'element-number',
  /** Element name (Iron) — grid → Folio <h2> */
  NAME: 'element-name',
  /** Cell background rect → Folio colour accent bar */
  CELL_BG: 'element-cell-bg',

  /** Back link (← Table / ← Fe · Iron) — persists across pages */
  NAV_BACK: 'nav-back',
  /** 4px colour rule — persists across pages */
  COLOR_RULE: 'color-rule',

  /** Viz navigation bar — persists across viz pages */
  VIZ_NAV: 'viz-nav',

  /** Folio data plate ↔ AtlasBrowsePage badge */
  DATA_PLATE_GROUP: 'data-plate-group',
  DATA_PLATE_PERIOD: 'data-plate-period',
  DATA_PLATE_BLOCK: 'data-plate-block',
} as const;

export type TransitionName = (typeof VT)[keyof typeof VT];

/* ── Conditional helper ───────────────────────────────────── */

/**
 * Returns `name` when `active === symbol`, otherwise `undefined`.
 *
 * Replaces the repeated ternary pattern:
 *   viewTransitionName: activeSymbol === el.symbol ? 'element-symbol' : undefined
 * with:
 *   viewTransitionName: vt(activeSymbol, el.symbol, VT.SYMBOL)
 */
export function vt(
  active: string | null,
  symbol: string,
  name: TransitionName,
): TransitionName | undefined {
  return active === symbol ? name : undefined;
}
