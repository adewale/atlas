/**
 * Regression tests for bugs fixed during the atlas project.
 * Each describe block corresponds to a specific bug that was found and fixed.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { blockColor } from '../src/lib/grid';
import {
  DEEP_BLUE,
  WARM_RED,
  MUSTARD,
  PAPER,
  BLACK,
  DIM,
  GREY_DARK,
  GREY_MID,
  GREY_LIGHT,
  GREY_RULE,
  MINERAL_BROWN,
  ASTRO_PURPLE,
} from '../src/lib/theme';

// ---------------------------------------------------------------------------
// Bug 1: MUSTARD colour inconsistency
// grid.ts had '#c59b1a' while theme.ts had '#856912'. All sources must agree.
// ---------------------------------------------------------------------------
describe('Color consistency: grid.ts ↔ theme.ts ↔ globals.css', () => {
  const BLOCK_TO_THEME: Record<string, string> = {
    s: DEEP_BLUE,
    p: MUSTARD,
    d: WARM_RED,
    f: BLACK,
  };

  it('blockColor() returns the same hex as the theme constant for every block', () => {
    for (const [block, expected] of Object.entries(BLOCK_TO_THEME)) {
      expect(blockColor(block)).toBe(expected);
    }
  });

  it('MUSTARD is specifically #856912 (WCAG AA compliant), not the old #c59b1a', () => {
    expect(MUSTARD).toBe('#856912');
    expect(blockColor('p')).toBe('#856912');
    // Guard against the old value ever creeping back
    expect(MUSTARD).not.toBe('#c59b1a');
    expect(blockColor('p')).not.toBe('#c59b1a');
  });

  it('globals.css custom properties match theme.ts constants', () => {
    const css = readFileSync(resolve(__dirname, '../src/globals.css'), 'utf-8');

    const cssVars: Record<string, string> = {};
    const varPattern = /--(paper|black|deep-blue|warm-red|mustard|dim):\s*(#[0-9a-fA-F]{3,8})/g;
    let match: RegExpExecArray | null;
    while ((match = varPattern.exec(css)) !== null) {
      cssVars[match[1]] = match[2];
    }

    expect(cssVars['paper']).toBe(PAPER);
    expect(cssVars['black']).toBe(BLACK);
    expect(cssVars['deep-blue']).toBe(DEEP_BLUE);
    expect(cssVars['warm-red']).toBe(WARM_RED);
    expect(cssVars['mustard']).toBe(MUSTARD);
    expect(cssVars['dim']).toBe(DIM);
  });
});

// ---------------------------------------------------------------------------
// Bug 2: PretextSvg double-slice
// When dropCap.char was explicitly provided, the component sliced lines[0]
// again, losing the first letter of the first word.
// ---------------------------------------------------------------------------
// The production PretextSvg component is exercised in components/PretextSvg.test.tsx.

// ---------------------------------------------------------------------------
// Bug 3: Theme token completeness
// Every exported color should be a valid hex color. No hardcoded #fff or #555.
// ---------------------------------------------------------------------------
describe('Theme token completeness and validity', () => {
  const allColors: Record<string, string> = {
    DEEP_BLUE,
    WARM_RED,
    MUSTARD,
    PAPER,
    BLACK,
    DIM,
    GREY_DARK,
    GREY_MID,
    GREY_LIGHT,
    GREY_RULE,
    MINERAL_BROWN,
    ASTRO_PURPLE,
  };

  it('every color constant is a valid hex color', () => {
    const hexPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    for (const [name, value] of Object.entries(allColors)) {
      expect(value, `${name} should be a valid hex color`).toMatch(hexPattern);
    }
  });

  it('no color constant is pure white (#fff or #ffffff)', () => {
    for (const [name, value] of Object.entries(allColors)) {
      const lower = value.toLowerCase();
      expect(lower, `${name} should not be pure white`).not.toBe('#fff');
      expect(lower, `${name} should not be pure white`).not.toBe('#ffffff');
    }
  });

  it('no color constant is the unnamed grey #555', () => {
    for (const [name, value] of Object.entries(allColors)) {
      const lower = value.toLowerCase();
      expect(lower, `${name} should not be unnamed grey #555`).not.toBe('#555');
      expect(lower, `${name} should not be unnamed grey #555555`).not.toBe('#555555');
    }
  });

  it('grid.ts source file does not contain hardcoded #c59b1a (old mustard)', () => {
    const gridSrc = readFileSync(resolve(__dirname, '../src/lib/grid.ts'), 'utf-8');
    expect(gridSrc).not.toContain('#c59b1a');
  });

  it('theme.ts source file does not contain hardcoded #fff or #555', () => {
    const themeSrc = readFileSync(resolve(__dirname, '../src/lib/theme.ts'), 'utf-8');
    // Match standalone hex values, not inside longer hex strings
    const lines = themeSrc.split('\n');
    for (const line of lines) {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue;
      // Check for bare #fff or #555 as color values (not inside a longer hex)
      const colorAssignment = line.match(/'(#[0-9a-fA-F]{3,8})'/);
      if (colorAssignment) {
        const hex = colorAssignment[1].toLowerCase();
        expect(hex, `theme.ts should not hardcode ${hex}`).not.toBe('#fff');
        expect(hex, `theme.ts should not hardcode ${hex}`).not.toBe('#ffffff');
        expect(hex, `theme.ts should not hardcode ${hex}`).not.toBe('#555');
        expect(hex, `theme.ts should not hardcode ${hex}`).not.toBe('#555555');
      }
    }
  });
});
