/**
 * Measurement parity: node-canvas (the unit-test measurement engine, see
 * tests/setup.ts) versus Chromium's canvas, for the fonts the app measures.
 *
 * Unit tests run @chenglou/pretext on node-canvas. If node-canvas measures a
 * font differently from the browser, layout tests pass on geometry the user
 * never sees; the May drop-cap overlap was a canvas-vs-rendered font
 * mismatch of exactly this kind. This replaces mock-contracts.spec.ts, whose
 * pretext mock was deleted on 2026-04-03 (9a16ad7).
 *
 * Both sides load the same committed Cinzel files (tests/fonts/).
 */
import { createRequire } from 'module';
import { test, expect } from './fixtures';
import { registerCinzelWithNodeCanvas } from '../fonts';
import { PRETEXT_SANS, dropCapCanvasFont } from '../../src/lib/pretext';

const require = createRequire(import.meta.url);
const { createCanvas, registerFont } = require('canvas') as typeof import('canvas');

// Same registration as tests/setup.ts.
registerCinzelWithNodeCanvas(registerFont);

const CASES = [
  { font: dropCapCanvasFont(80), texts: ['A', 'H', 'I', 'M', 'O', 'T', 'W', 'Hydrogen'] },
  { font: dropCapCanvasFont(56), texts: ['E', 'P', 'Q', 'Z'] },
  { font: `16px ${PRETEXT_SANS}`, texts: ['Iron is a transition metal.', 'The quick brown fox jumps over the lazy dog'] },
];
// Allowed difference between the two engines: 1% of the width, but at
// least 1 px. Chromium on the CI image returns hinted whole-pixel advances
// for single glyphs (E at 56 px: 36.00 vs node-canvas 35.39); a fallback
// font is off by 5-12 px per drop-cap glyph, so it still fails.
const TOLERANCE = 0.01;
const MIN_TOLERANCE_PX = 1;

function nodeWidths(): Record<string, number> {
  const ctx = createCanvas(10, 10).getContext('2d');
  const out: Record<string, number> = {};
  for (const { font, texts } of CASES) {
    ctx.font = font;
    for (const text of texts) out[`${font} | ${text}`] = ctx.measureText(text).width;
  }
  return out;
}

test('node-canvas and Chromium agree on text widths for the fonts the app measures', async ({ page }) => {
  await page.goto('/');
  const browserWidths = await page.evaluate(async (cases) => {
    // Load Cinzel explicitly: canvas never triggers a web-font load itself.
    for (const { font } of cases) {
      const faces = await document.fonts.load(font, 'A');
      if (font.includes('Cinzel') && faces.length === 0) throw new Error(`Cinzel did not load for ${font}`);
    }
    const ctx = new OffscreenCanvas(10, 10).getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    const out: Record<string, number> = {};
    for (const { font, texts } of cases) {
      ctx.font = font;
      for (const text of texts) out[`${font} | ${text}`] = ctx.measureText(text).width;
    }
    return out;
  }, CASES);

  const node = nodeWidths();
  expect(Object.keys(browserWidths).sort()).toEqual(Object.keys(node).sort());
  const mismatches = Object.entries(browserWidths)
    .map(([key, chromium]) => ({ key, chromium, node: node[key], diff: Math.abs(node[key] - chromium) / chromium }))
    .filter(({ chromium, node: n }) => !(Math.abs(n - chromium) <= Math.max(TOLERANCE * chromium, MIN_TOLERANCE_PX)));
  expect(
    mismatches,
    mismatches.map((m) => `${m.key}: chromium ${m.chromium.toFixed(2)} vs node-canvas ${m.node.toFixed(2)}`).join('\n'),
  ).toEqual([]);
});
