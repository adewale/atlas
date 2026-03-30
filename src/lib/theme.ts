/**
 * Shared colour constants and category utilities.
 * Single source of truth — never hardcode hex values elsewhere.
 */
import type React from 'react';

export const DEEP_BLUE = '#133e7c';
export const WARM_RED = '#9e1c2c';
export const MUSTARD = '#c59b1a';
export const PAPER = '#f7f2e8';
export const BLACK = '#0f0f0f';
export const DIM = '#ece7db';

/* Grey scale — use instead of hardcoded hex */
export const GREY_DARK = '#333';
export const GREY_MID = '#666';
export const GREY_LIGHT = '#999';
export const GREY_RULE = '#ccc';

/* Etymology-specific palette (not in the core 4-colour system) */
export const MINERAL_BROWN = '#5a3e1b';
export const ASTRO_PURPLE = '#4a0e6b';

/* Typography — canonical monospace stack */
export const MONO_FONT = "'SF Mono', 'Cascadia Code', 'Fira Code', monospace";

/* Shared style objects */
export const BACK_LINK_STYLE: React.CSSProperties = {
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: GREY_MID,
};

/** Map a category string to its display color. */
export function categoryColor(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('metalloid')) return MUSTARD;
  if (cat.includes('nonmetal') || cat.includes('noble')) return WARM_RED;
  return DEEP_BLUE;
}

/** Convert category name to URL slug. */
export function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/** Convert URL slug back to category label. */
export function fromSlug(slug: string): string {
  return slug.replace(/-/g, ' ');
}
