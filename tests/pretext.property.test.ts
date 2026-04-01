import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock @chenglou/pretext at the boundary - verify our wrappers use it correctly
const mockPrepareWithSegments = vi.fn((_text: string) => ({
  __brand: 'prepared',
  _text,
  widths: Array.from({ length: _text.length }, () => 8),
}));

const mockLayout = vi.fn((_prepared: unknown, _maxWidth?: number, _lineSpacing?: number) => ({
  lineCount: 1,
  height: 20,
}));

const mockLayoutWithLines = vi.fn((_prepared: unknown, maxWidth: number, lineHeight: number) => {
  const text = (_prepared as { _text: string })._text;
  // Simulate realistic line breaking: ~8px per char
  const charWidth = 8;
  const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
  const lines = [];
  for (let i = 0; i < text.length; i += charsPerLine) {
    const lineText = text.slice(i, i + charsPerLine);
    lines.push({
      text: lineText,
      width: lineText.length * charWidth,
      start: { segmentIndex: 0, graphemeIndex: i },
      end: { segmentIndex: 0, graphemeIndex: Math.min(i + charsPerLine, text.length) },
    });
  }
  return { lineCount: lines.length, height: lines.length * lineHeight, lines };
});

const mockLayoutNextLine = vi.fn((_prepared: unknown, start: { segmentIndex: number; graphemeIndex: number }, maxWidth: number) => {
  const text = (_prepared as { _text: string })._text;
  const charWidth = 8;
  const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
  const startIdx = start.graphemeIndex;
  if (startIdx >= text.length) return null;
  const lineText = text.slice(startIdx, startIdx + charsPerLine);
  return {
    text: lineText,
    width: lineText.length * charWidth,
    start: { segmentIndex: 0, graphemeIndex: startIdx },
    end: { segmentIndex: 0, graphemeIndex: Math.min(startIdx + charsPerLine, text.length) },
  };
});

vi.mock('@chenglou/pretext', () => ({
  prepareWithSegments: (...args: unknown[]) => mockPrepareWithSegments(...(args as [string])),
  layout: (...args: unknown[]) => mockLayout(...(args as [unknown, number, number])),
  layoutWithLines: (...args: unknown[]) => mockLayoutWithLines(...(args as [unknown, number, number])),
  layoutNextLine: (...args: unknown[]) => mockLayoutNextLine(...(args as [unknown, { segmentIndex: number; graphemeIndex: number }, number])),
}));

import { measureLines, shapeText, fitLabel, computeLineHeight, dropCapLayout } from '../src/lib/pretext';

const textArb = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0);
const widthArb = fc.integer({ min: 40, max: 2000 });

describe('Pretext wrapper integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('measureLines', () => {
    it('passes font and maxWidth through to prepareWithSegments and layoutWithLines', () => {
      measureLines('hello world', 'bold 14px serif', 300, 18);
      expect(mockPrepareWithSegments).toHaveBeenCalledWith('hello world', 'bold 14px serif');
      expect(mockLayoutWithLines).toHaveBeenCalledWith(
        expect.objectContaining({ _text: 'hello world' }),
        300,
        18,
      );
    });

    it('transforms LayoutLine results into PositionedLine with correct y positions', () => {
      const lines = measureLines('a]b'.repeat(30), '16px system-ui', 100, 22);
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

    it('forAll(text, width): all text content is preserved across lines', () => {
      fc.assert(
        fc.property(textArb, widthArb, (text, width) => {
          const lines = measureLines(text, '16px system-ui', width, 20);
          const reconstructed = lines.map((l) => l.text).join('');
          expect(reconstructed).toBe(text);
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
    it('passes font to prepareWithSegments and uses per-line widths', () => {
      const widths = [200, 200, 400, 400];
      shapeText('some text here for testing', '14px monospace', widths, 20);
      expect(mockPrepareWithSegments).toHaveBeenCalledWith('some text here for testing', '14px monospace');
      // layoutNextLine should have been called at least once
      expect(mockLayoutNextLine).toHaveBeenCalled();
    });

    it('uses last width in array when lines exceed widthPerLine length', () => {
      // Text long enough to exceed 2 lines at width 80
      const longText = 'a'.repeat(100);
      const widths = [80, 160]; // only 2 entries, last used for overflow
      shapeText(longText, '16px system-ui', widths, 20);

      // Verify layoutNextLine was called with width 80 first, then 160 for subsequent
      const calls = mockLayoutNextLine.mock.calls;
      expect(calls[0][2]).toBe(80); // first line uses widths[0]
      expect(calls[1][2]).toBe(160); // second line uses widths[1]
      if (calls.length > 2) {
        expect(calls[2][2]).toBe(160); // third+ line uses last width
      }
    });

    it('forAll(text): shaped text preserves all content', () => {
      fc.assert(
        fc.property(textArb, (text) => {
          const widths = [200, 200, 400];
          const lines = shapeText(text, '16px system-ui', widths, 20);
          const reconstructed = lines.map((l) => l.text).join('');
          expect(reconstructed).toBe(text);
        }),
        { numRuns: 30 },
      );
    });

    it('produces PositionedLines with sequential y coordinates', () => {
      const lines = shapeText('hello world test text', '16px system-ui', [100, 200], 18);
      for (let i = 0; i < lines.length; i++) {
        expect(lines[i].x).toBe(0);
        expect(lines[i].y).toBe(i * 18);
      }
    });
  });

  describe('fitLabel', () => {
    it('passes font to prepareWithSegments and calls layout', () => {
      fitLabel('Fe', 'bold 20px sans-serif', 100);
      expect(mockPrepareWithSegments).toHaveBeenCalledWith('Fe', 'bold 20px sans-serif');
      expect(mockLayout).toHaveBeenCalledWith(
        expect.objectContaining({ _text: 'Fe' }),
        100,
        0,
      );
    });

    it('returns true when layout.lineCount <= 1', () => {
      mockLayout.mockReturnValueOnce({ lineCount: 1, height: 20 });
      expect(fitLabel('short', '16px system-ui', 500)).toBe(true);
    });

    it('returns false when layout.lineCount > 1', () => {
      mockLayout.mockReturnValueOnce({ lineCount: 2, height: 40 });
      expect(fitLabel('very long text', '16px system-ui', 10)).toBe(false);
    });
  });

  describe('dropCapLayout', () => {
    it('extracts first char and calls shapeText for the rest', () => {
      const result = dropCapLayout('Hello world', '16px system-ui', '48px system-ui', 400, 20);
      expect(result.dropCap.char).toBe('H');
      // prepareWithSegments should be called twice: once for the drop cap char, once for the rest
      expect(mockPrepareWithSegments).toHaveBeenCalledWith('H', '48px system-ui');
      expect(mockPrepareWithSegments).toHaveBeenCalledWith('ello world', '16px system-ui');
    });

    it('drop cap height uses cap-height ratio', () => {
      const result = dropCapLayout('Abc', '16px system-ui', '48px system-ui', 400, 20);
      expect(result.dropCap.fontSize).toBe(48);
      // Cap height is ~75% of font size for serif fonts
      expect(result.dropCap.height).toBe(Math.ceil(48 * 0.75));
    });

    it('lines beside drop cap have x offset', () => {
      // With 48px drop cap font, dropHeight=ceil(48*0.75)=36, lineHeight=20 => dropCapLines = ceil(36/20) = 2
      const result = dropCapLayout('A' + 'b'.repeat(150), '16px system-ui', '48px system-ui', 400, 20);
      const dropCapLines = Math.ceil(Math.ceil(48 * 0.75) / 20); // 2
      for (let i = 0; i < Math.min(dropCapLines, result.lines.length); i++) {
        expect(result.lines[i].x).toBeGreaterThan(0);
      }
    });

    it('later lines return to x=0', () => {
      const result = dropCapLayout('A' + 'b'.repeat(150), '16px system-ui', '48px system-ui', 400, 20);
      const dropCapLines = Math.ceil(Math.ceil(48 * 0.75) / 20); // 2
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
      expect(h).toBe(Math.ceil(18 * 1.2)); // 22
    });

    it('uses default 16px when no font provided', () => {
      const h = computeLineHeight();
      expect(h).toBe(Math.ceil(16 * 1.2)); // 20
    });

    it('handles fractional font sizes', () => {
      const h = computeLineHeight('14.5px system-ui');
      expect(h).toBe(Math.ceil(14.5 * 1.2)); // 18
    });

    it('falls back to 16px when font string has no px size', () => {
      const h = computeLineHeight('medium sans-serif');
      expect(h).toBe(Math.ceil(16 * 1.2)); // 20
    });
  });
});
