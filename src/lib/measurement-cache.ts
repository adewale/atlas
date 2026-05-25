import { clearCache } from '@chenglou/pretext';

/**
 * Bug this exists to prevent: drop-cap "O" overlapping body text on first
 * load. `@chenglou/pretext` keeps a singleton OffscreenCanvas; WebKit
 * caches the resolved font on a 2D context, so once `ctx.font = "700 80px
 * Cinzel, Georgia, serif"` resolves to Georgia (web font not loaded yet),
 * re-setting the same string after Cinzel loads doesn't re-resolve. The
 * canvas keeps returning Georgia metrics. Pretext's `clearCache()` clears
 * the width-cache map but does NOT discard the canvas, so re-measurement
 * after the `useFontsReady` signal repopulates the cache with the same
 * wrong widths.
 *
 * We solve this for the one measurement that depends on a slow-loading
 * web font — the drop-cap character — by owning a separate canvas and
 * throwing it away when fonts load. By construction the next measurement
 * creates a fresh canvas that has no prior font binding to be stuck on.
 */

type MeasurementContext = {
  font: string;
  measureText(text: string): TextMetrics;
};

let cachedContext: MeasurementContext | null = null;

function getContext(): MeasurementContext {
  if (cachedContext !== null) return cachedContext;

  if (typeof OffscreenCanvas !== 'undefined') {
    const ctx = new OffscreenCanvas(1, 1).getContext('2d');
    if (ctx) {
      cachedContext = ctx;
      return cachedContext;
    }
  }

  if (typeof document !== 'undefined') {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      cachedContext = ctx;
      return cachedContext;
    }
  }

  throw new Error('Text measurement requires OffscreenCanvas or a DOM canvas context.');
}

/**
 * Measure a single character's advance width on a canvas we own. Used in
 * place of pretext's measurement for the drop-cap character so we can
 * discard the canvas on font load and avoid WebKit's sticky font
 * resolution.
 */
export function measureCharWidth(char: string, font: string): number {
  const ctx = getContext();
  ctx.font = font;
  const metrics = ctx.measureText(char);
  // Canvas `width` is the advance width. SVG overlap cares about painted ink;
  // glyphs can extend past their advance box on some platforms. Use the right
  // ink bound when the browser exposes it, falling back to advance width.
  return Math.max(metrics.width, metrics.actualBoundingBoxRight || 0);
}

/**
 * Discard cached measurement state after web fonts finish loading. The
 * next `measureCharWidth` call constructs a fresh canvas; pretext's
 * width-cache map is cleared so previously-cached fallback widths are
 * also dropped.
 */
export function invalidateMeasurementState(): void {
  cachedContext = null;
  clearCache();
}
