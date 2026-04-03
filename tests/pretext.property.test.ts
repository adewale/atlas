import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { measureLines, shapeText, fitLabel, computeLineHeight, dropCapLayout } from '../src/lib/pretext';

/**
 * Pretext wrapper property tests — using real @chenglou/pretext via node-canvas.
 *
 * These tests exercise the actual text measurement pipeline (no mocks).
 * Font metrics come from node-canvas (Cairo/Pango) which differ slightly
 * from browser fonts, but the structural properties still hold.
 */

const textArb = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0);
const widthArb = fc.integer({ min: 40, max: 2000 });

describe('Pretext wrapper — real measurement', () => {
  describe('measureLines', () => {
    it('produces at least one line for non-empty text', () => {
      const lines = measureLines('hello world', '16px system-ui', 300, 20);
      expect(lines.length).toBeGreaterThanOrEqual(1);
      expect(lines[0].text.length).toBeGreaterThan(0);
    });

    it('transforms results into PositionedLine with correct y positions', () => {
      const lines = measureLines('some text that is long enough to wrap at least once or twice in a narrow column', '16px system-ui', 100, 22);
      for (let i = 0; i < lines.length; i++) {
        expect(lines[i].x).toBe(0);
        expect(lines[i].y).toBe(i * 22);
        expect(lines[i]).toHaveProperty('text');
        expect(lines[i]).toHaveProperty('width');
      }
    });

    it('forAll(text, width): produces at least one line for non-empty text', () => {
      fc.assert(
        fc.property(textArb, widthArb, (text, width) => {
          const lines = measureLines(text, '16px system-ui', width, 20);
          expect(lines.length).toBeGreaterThanOrEqual(1);
          expect(lines[0].text.length).toBeGreaterThan(0);
        }),
        { numRuns: 50 },
      );
    });

    it('forAll(text, w1 < w2): narrower width produces >= lines', () => {
      fc.assert(
        fc.property(textArb, widthArb, widthArb, (text, w1, w2) => {
          const small = Math.min(w1, w2);
          const large = Math.max(w1, w2);
          if (small === large) return;
          const narrowLines = measureLines(text, '16px system-ui', small, 20);
          const wideLines = measureLines(text, '16px system-ui', large, 20);
          expect(narrowLines.length).toBeGreaterThanOrEqual(wideLines.length);
        }),
        { numRuns: 50 },
      );
    });

    it('forAll(text, width): all text content is preserved across lines (modulo whitespace trimming)', () => {
      fc.assert(
        fc.property(textArb, widthArb, (text, width) => {
          const lines = measureLines(text, '16px system-ui', width, 20);
          const reconstructed = lines.map((l) => l.text).join('');
          // Real text measurement trims trailing whitespace at line breaks.
          // The non-whitespace content must be fully preserved.
          expect(reconstructed.replace(/\s+/g, ' ').trim()).toBe(text.replace(/\s+/g, ' ').trim());
        }),
        { numRuns: 50 },
      );
    });

    it('forAll(text, width): line widths are non-negative', () => {
      fc.assert(
        fc.property(textArb, widthArb, (text, width) => {
          const lines = measureLines(text, '16px system-ui', width, 20);
          for (const line of lines) {
            expect(line.width).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 30 },
      );
    });
  });

  describe('shapeText', () => {
    it('produces PositionedLines with sequential y coordinates', () => {
      const lines = shapeText('hello world this is a test of shaped text wrapping', '16px system-ui', [100, 200], 18);
      for (let i = 0; i < lines.length; i++) {
        expect(lines[i].x).toBe(0);
        expect(lines[i].y).toBe(i * 18);
      }
    });

    it('uses narrower widths for early lines', () => {
      const longText = 'The quick brown fox jumps over the lazy dog and then some more text to ensure wrapping occurs.';
      const widths = [80, 80, 400, 400];
      const lines = shapeText(longText, '16px system-ui', widths, 20);
      // With narrow first lines (80px) and wide later ones (400px),
      // the first lines should be shorter (fewer chars) than later ones
      if (lines.length >= 3) {
        expect(lines[0].text.length).toBeLessThanOrEqual(lines[2].text.length + 5);
      }
    });

    it('forAll(text): shaped text preserves all content (modulo whitespace trimming)', () => {
      fc.assert(
        fc.property(textArb, (text) => {
          const widths = [200, 200, 400];
          const lines = shapeText(text, '16px system-ui', widths, 20);
          const reconstructed = lines.map((l) => l.text).join('');
          expect(reconstructed.replace(/\s+/g, ' ').trim()).toBe(text.replace(/\s+/g, ' ').trim());
        }),
        { numRuns: 30 },
      );
    });
  });

  describe('fitLabel', () => {
    it('returns true for short text in wide container', () => {
      expect(fitLabel('Fe', '16px system-ui', 500)).toBe(true);
    });

    it('returns false for long text in narrow container', () => {
      expect(fitLabel('alkaline earth metal', '16px system-ui', 20)).toBe(false);
    });

    it('short symbols always fit at reasonable widths', () => {
      const symbols = ['H', 'He', 'Li', 'Fe', 'Au', 'Og'];
      for (const sym of symbols) {
        expect(fitLabel(sym, 'bold 16px system-ui', 100), `${sym} should fit in 100px`).toBe(true);
      }
    });
  });

  describe('dropCapLayout', () => {
    it('extracts first char as drop cap', () => {
      const result = dropCapLayout('Hello world', '16px system-ui', '48px system-ui', 400, 20);
      expect(result.dropCap.char).toBe('H');
      expect(result.dropCap.fontSize).toBe(48);
    });

    it('drop cap has positive width and height', () => {
      const result = dropCapLayout('Atlas', '16px system-ui', '48px system-ui', 400, 20);
      expect(result.dropCap.width).toBeGreaterThan(0);
      expect(result.dropCap.height).toBeGreaterThan(0);
    });

    it('lines beside drop cap have x offset', () => {
      const result = dropCapLayout('A' + 'b '.repeat(80), '16px system-ui', '48px system-ui', 400, 20);
      // At least the first line should be indented past the drop cap
      if (result.lines.length > 0) {
        expect(result.lines[0].x).toBeGreaterThan(0);
      }
    });

    it('later lines return to x=0', () => {
      const result = dropCapLayout('A' + 'b '.repeat(80), '16px system-ui', '48px system-ui', 400, 20);
      const dropCapLines = Math.ceil(result.dropCap.height / 20);
      for (let i = dropCapLines; i < result.lines.length; i++) {
        expect(result.lines[i].x).toBe(0);
      }
    });

    it('forAll(text): drop cap char equals text[0]', () => {
      fc.assert(
        fc.property(textArb, (text) => {
          const result = dropCapLayout(text, '16px system-ui', '48px system-ui', 400, 20);
          expect(result.dropCap.char).toBe(text[0]);
        }),
        { numRuns: 50 },
      );
    });

    it('returns empty result for empty text', () => {
      const result = dropCapLayout('', '16px system-ui', '48px system-ui', 400, 20);
      expect(result.dropCap.char).toBe('');
      expect(result.dropCap.width).toBe(0);
      expect(result.lines).toEqual([]);
    });
  });

  describe('computeLineHeight', () => {
    it('parses font size and returns 1.2× multiplier', () => {
      const h = computeLineHeight('18px serif');
      expect(h).toBe(Math.ceil(18 * 1.2));
    });

    it('uses default 16px when no font provided', () => {
      const h = computeLineHeight();
      expect(h).toBe(Math.ceil(16 * 1.2));
    });

    it('handles fractional font sizes', () => {
      const h = computeLineHeight('14.5px system-ui');
      expect(h).toBe(Math.ceil(14.5 * 1.2));
    });

    it('falls back to 16px when font string has no px size', () => {
      const h = computeLineHeight('medium sans-serif');
      expect(h).toBe(Math.ceil(16 * 1.2));
    });
  });
});
