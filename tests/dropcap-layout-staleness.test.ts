import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Directly encodes the drop-cap overlap bug at the layout level.
 *
 * The bug: the first measurement of the drop-cap glyph happens during the
 * web-font fallback period and returns a narrow width; after the font
 * loads the glyph is wider, but the indent stayed at the narrow value, so
 * the rendered drop cap overlapped the body text.
 *
 * `dropCapLayout` must therefore reflect whatever `measureCharWidth`
 * currently returns — it must NOT cache the drop-cap width internally
 * (the old code path cached it via pretext's `prepareWithSegments`). We
 * simulate the fallback→loaded transition by changing the mocked
 * `measureCharWidth` return value between calls.
 */

const TEXT =
  'One hundred and eighteen elements make up all known matter. Forty are ' +
  'transition metals, 28 occupy the f-block as lanthanides and actinides, ' +
  'and just 7 are noble gases.';

describe('dropCapLayout: indent tracks the corrected drop-cap width', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('../src/lib/measurement-cache');
  });

  it('uses the latest measureCharWidth result, not a stale cached value', async () => {
    let charWidth = 30; // narrow fallback-period measurement
    vi.doMock('../src/lib/measurement-cache', () => ({
      measureCharWidth: () => charWidth,
      invalidateMeasurementState: () => {},
    }));
    const { dropCapLayout } = await import('../src/lib/pretext');

    const stale = dropCapLayout(TEXT, '16px sans-serif', '80px Cinzel, serif', 360, 20);
    expect(stale.dropCap.width).toBe(30);
    expect(stale.lines[0].x).toBe(34); // 30 + gap(4)

    // Web font swaps in → wider glyph.
    charWidth = 60;
    const fresh = dropCapLayout(TEXT, '16px sans-serif', '80px Cinzel, serif', 360, 20);
    expect(fresh.dropCap.width).toBe(60);
    expect(fresh.lines[0].x).toBe(64);
    expect(fresh.lines[0].x).toBeGreaterThan(stale.lines[0].x);
  });

  it('uses an explicit bold canvas font for drop-cap measurement', async () => {
    let measuredFont = '';
    vi.doMock('../src/lib/measurement-cache', () => ({
      measureCharWidth: (_char: string, font: string) => {
        measuredFont = font;
        return 60;
      },
      invalidateMeasurementState: () => {},
    }));
    const { dropCapLayout, dropCapCanvasFont } = await import('../src/lib/pretext');

    const font = dropCapCanvasFont(80);
    dropCapLayout(TEXT, '16px sans-serif', font, 360, 20);

    expect(measuredFont).toBe('700 80px Cinzel, Georgia, serif');
  });

  it('every indented line clears the drop cap width (no overlap by construction)', async () => {
    for (const w of [20, 35, 50, 65, 80]) {
      vi.resetModules();
      vi.doMock('../src/lib/measurement-cache', () => ({
        measureCharWidth: () => w,
        invalidateMeasurementState: () => {},
      }));
      const { dropCapLayout } = await import('../src/lib/pretext');

      const r = dropCapLayout(TEXT, '16px sans-serif', '80px Cinzel, serif', 360, 20);
      const dropCapLines = Math.ceil(r.dropCap.height / 20);
      for (let i = 0; i < Math.min(dropCapLines, r.lines.length); i++) {
        expect(
          r.lines[i].x,
          `line ${i} must start at or past the drop-cap width ${w}`,
        ).toBeGreaterThanOrEqual(w);
      }
    }
  });
});
