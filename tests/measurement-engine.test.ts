/**
 * The unit-tier measurement engine (node-canvas, tests/setup.ts) must measure
 * the drop-cap font like the browser does. Expected widths were recorded
 * from Chromium by tests/e2e/measurement-parity.spec.ts (700 80px Cinzel,
 * canvas advance widths); that spec re-checks them against a live browser.
 * With no Cinzel registered, node-canvas falls back to a serif font that is
 * 8-21% off, so drop-cap layout tests would pass on geometry users never see.
 */
import { describe, expect, it } from 'vitest';
import { dropCapCanvasFont } from '../src/lib/pretext';

const CHROMIUM_WIDTHS_80PX: Record<string, number> = {
  A: 57.36,
  H: 68.96,
  I: 30.96,
  M: 76.24,
  O: 70.32,
  T: 53.36,
  W: 77.68,
  Hydrogen: 458.24,
};

describe('node-canvas measures Cinzel like Chromium', () => {
  it.each(Object.entries(CHROMIUM_WIDTHS_80PX))('%s', (text, chromium) => {
    const ctx = new OffscreenCanvas(10, 10).getContext('2d') as unknown as CanvasRenderingContext2D;
    ctx.font = dropCapCanvasFont(80);
    expect(ctx.measureText(text).width).toBeCloseTo(chromium, 1);
  });
});
