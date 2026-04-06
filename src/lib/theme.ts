/**
 * Shared colour constants and category utilities.
 * Single source of truth — never hardcode hex values elsewhere.
 *
 * ## Style policy
 *
 * Atlas uses a hybrid approach with clear boundaries:
 *
 * **globals.css** owns:
 * - CSS custom properties (--paper, --black, --deep-blue, etc.)
 * - Keyframe animations (folio-line-reveal, plate-wipe, bar-grow, etc.)
 * - View Transition API morphing rules
 * - Responsive breakpoints (@media queries)
 * - Component classes that need cascade (.etymology-card, .folio-layout, etc.)
 * - Spacing scale (--sp-1 through --sp-12)
 * - Easing functions (--ease-out, --ease-spring, etc.)
 * - Stroke tiers (--stroke-hairline through --stroke-heavy)
 *
 * **theme.ts** owns:
 * - Colour constants for use in JSX (DEEP_BLUE, WARM_RED, etc.)
 * - Grey scale (GREY_DARK, GREY_MID, GREY_LIGHT, GREY_RULE)
 * - Named style objects for typography (INSCRIPTION_STYLE, SECTION_HEADING_STYLE, etc.)
 * - Computed values (categoryColor, toSlug/fromSlug)
 * - Layout constants (CONTROL_SECTION_MIN_HEIGHT)
 *
 * **Inline styles** are appropriate for:
 * - One-off layout (flex, gap, margin on a specific container)
 * - Dynamic values (colours derived from data, positions from props)
 * - SVG attributes (fill, stroke, transform)
 *
 * **Inline styles** should NOT:
 * - Duplicate values already in theme.ts — use the constant
 * - Hardcode hex colours — import from this file
 * - Recreate animation/transition logic — use CSS classes
 */
import type React from 'react';

export const DEEP_BLUE = '#133e7c';
export const WARM_RED = '#9e1c2c';
export const MUSTARD = '#856912'; /* WCAG AA 4.7:1 on PAPER — was #c59b1a */
export const PAPER = '#f7f2e8';
export const BLACK = '#0f0f0f';
export const DIM = '#ece7db';

/* Grey scale — use instead of hardcoded hex */
export const GREY_DARK = '#333';
export const GREY_MID = '#666';
export const GREY_LIGHT = '#696969'; /* WCAG AA 4.9:1 on PAPER — was #999 */
export const GREY_RULE = '#ccc';

/* Etymology-specific palette (not in the core 4-colour system) */
export const MINERAL_BROWN = '#5a3e1b';
export const ASTRO_PURPLE = '#4a0e6b';

/* Stroke widths — six standardised tiers for all borders, strokes, rules */
export const STROKE_HAIRLINE = 0.5;
export const STROKE_THIN = 1;
export const STROKE_REGULAR = 1.5;
export const STROKE_MEDIUM = 2;
export const STROKE_ACCENT = 3;
export const STROKE_HEAVY = 4;

/* Typography — canonical monospace stack */
export const MONO_FONT = "'SF Mono', 'Cascadia Code', 'Fira Code', monospace";

/** Max width for viz page intro/controls (matches SVG grid width). */
export const VIZ_MAX_WIDTH = 760;

/** Max width for prose pages (About, Credits, Design, Animation, Entity Map). */
export const PROSE_MAX_WIDTH = 800;

/**
 * Minimum height for the control/intro section between the tab nav and
 * the main visualization.  Every viz page wraps its heading + legend +
 * filters in a container with this minHeight so the SVG starts at the
 * same vertical position regardless of which tab is active.
 */
export const CONTROL_SECTION_MIN_HEIGHT = 140;

/**
 * Breakpoint for switching viz pages to the sectioned card layout.
 * Set to 1024px so landscape phones (≤932px) also get the card view
 * instead of the wide SVG that produces tiny, unreadable text.
 */
export const MOBILE_VIZ_BREAKPOINT = 1024;

/* Shared style objects */
export const BACK_LINK_STYLE: React.CSSProperties = {
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: GREY_MID,
};

/** Inscription title: 13px bold uppercase with wide tracking */
export const INSCRIPTION_STYLE = {
  fontSize: '13px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  margin: '0 0 16px',
} as const;

/** Section heading: 20px bold with subtle tracking */
export const SECTION_HEADING_STYLE = {
  fontSize: '20px',
  fontWeight: 'bold',
  letterSpacing: '0.05em',
  marginBottom: '16px',
} as const;

export const LABEL_STYLE = {
  fontSize: '10px',
  textTransform: 'uppercase',
  color: GREY_MID,
} as const;

export const NAV_PILL_STYLE = {
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  textDecoration: 'none',
} as const;

/** Small uppercase section label: 11px bold with wide tracking */
export const SECTION_LABEL_STYLE = {
  fontSize: '11px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: GREY_MID,
  marginBottom: '8px',
} as const;

/** Map a category string to its display color. */
export function categoryColor(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('metalloid')) return MUSTARD;
  if (cat.includes('nonmetal') || cat.includes('noble')) return WARM_RED;
  return DEEP_BLUE;
}

