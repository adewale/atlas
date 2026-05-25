import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  measureCharWidth,
  invalidateMeasurementState,
} from '../src/lib/measurement-cache';

// Track OffscreenCanvas constructions without breaking the constructor
// behaviour. `vi.spyOn` on a class constructor strips the [[Construct]]
// internal slot in some Node versions; we wrap manually instead.
const RealOffscreenCanvas = globalThis.OffscreenCanvas;
let constructionCount = 0;
class TrackingOffscreenCanvas extends (RealOffscreenCanvas as new (w: number, h: number) => OffscreenCanvas) {
  constructor(w: number, h: number) {
    super(w, h);
    constructionCount++;
  }
}

function installCanvasTracker(): void {
  constructionCount = 0;
  (globalThis as { OffscreenCanvas: unknown }).OffscreenCanvas = TrackingOffscreenCanvas;
}

function uninstallCanvasTracker(): void {
  (globalThis as { OffscreenCanvas: unknown }).OffscreenCanvas = RealOffscreenCanvas;
}

/**
 * Regression: drop cap overlapping body text on first load.
 *
 * Root cause: `@chenglou/pretext` uses a singleton OffscreenCanvas for all
 * measurements. WebKit caches the resolved font on a 2D context — once
 * `ctx.font = "700 80px Cinzel, Georgia, serif"` resolves to Georgia (because
 * Cinzel hasn't loaded yet), re-setting the same string after Cinzel
 * loads does not re-resolve. `clearCache()` clears the width-cache map but
 * does NOT touch the canvas, so post-font-load re-measurements stay stuck
 * on the fallback metrics. The drop cap renders at the wider Cinzel width,
 * but the body-text indent stays at the narrower Georgia width — overlap.
 *
 * The fix: own a separate canvas for the one measurement that depends on
 * a slow-loading web font (the drop-cap character), and discard it on
 * font load so the next measurement creates a fresh canvas with the web
 * font already resolvable. By construction there is no canvas to be
 * "sticky" because we threw the previous one away.
 */
describe('measurement-cache: own canvas avoids pretext singleton stickiness', () => {
  beforeEach(() => {
    invalidateMeasurementState();
  });

  afterEach(() => {
    uninstallCanvasTracker();
  });

  describe('measureCharWidth', () => {
    it('returns a positive width for a printable character', () => {
      const w = measureCharWidth('O', '80px serif');
      expect(w).toBeGreaterThan(0);
    });

    it('returns different widths for visibly different glyphs', () => {
      const i = measureCharWidth('i', '80px serif');
      const w = measureCharWidth('W', '80px serif');
      expect(w).toBeGreaterThan(i);
    });

    it('reuses a single canvas across calls within a font-load epoch', () => {
      installCanvasTracker();
      measureCharWidth('a', '80px serif');
      measureCharWidth('b', '80px serif');
      measureCharWidth('c', '80px serif');
      expect(constructionCount).toBe(1);
    });

    it('falls back to a DOM canvas when OffscreenCanvas is unavailable', () => {
      invalidateMeasurementState();
      (globalThis as { OffscreenCanvas: unknown }).OffscreenCanvas = undefined;

      const w = measureCharWidth('O', '80px serif');

      expect(w).toBeGreaterThan(0);
    });
  });

  describe('invalidateMeasurementState', () => {
    it('discards the cached canvas — next measurement creates a fresh one', () => {
      // Warm the cache so the next measureCharWidth would otherwise reuse it.
      measureCharWidth('O', '80px serif');

      installCanvasTracker();
      invalidateMeasurementState();
      measureCharWidth('O', '80px serif');

      expect(
        constructionCount,
        'must construct a new canvas after invalidation so a stale resolved font is discarded',
      ).toBe(1);
    });

    it('is idempotent — calling twice does not crash and leaves cache empty', () => {
      measureCharWidth('O', '80px serif');
      invalidateMeasurementState();
      invalidateMeasurementState();

      installCanvasTracker();
      measureCharWidth('O', '80px serif');
      expect(constructionCount).toBe(1);
    });
  });
});
