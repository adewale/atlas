/**
 * Pure colour utilities — no data dependencies.
 *
 * Block colours and WCAG contrast calculation. These functions are
 * imported by EntityCard, ByrneChips, and many other components that
 * only need colour lookups. Keeping them separate from grid layout
 * avoids pulling in the 177KB allElements chunk.
 */
import { DEEP_BLUE, WARM_RED, MUSTARD, BLACK, PAPER } from './theme';

// ---------------------------------------------------------------------------
// Block colours
// ---------------------------------------------------------------------------
const BLOCK_COLORS: Record<string, string> = {
  s: DEEP_BLUE,
  p: MUSTARD,
  d: WARM_RED,
  f: BLACK,
};

export function blockColor(block: string): string {
  return BLOCK_COLORS[block] ?? BLACK;
}

// ---------------------------------------------------------------------------
// Contrast text colour (WCAG relative luminance)
// ---------------------------------------------------------------------------
function sRGBtoLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

/** Returns BLACK for light fills, PAPER for dark fills. */
const contrastCache = new Map<string, string>();

export function contrastTextColor(fillHex: string): string {
  let result = contrastCache.get(fillHex);
  if (result === undefined) {
    result = relativeLuminance(fillHex) > 0.179 ? BLACK : PAPER;
    contrastCache.set(fillHex, result);
  }
  return result;
}
