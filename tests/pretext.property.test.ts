import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as fc from 'fast-check';

// Pretext requires canvas for font measurement which jsdom doesn't have.
// We mock the core functions to test our wrapper logic and the invariants
// that should hold regardless of the measurement backend.

// Create mock implementations that simulate pretext behavior
const mockPrepareWithSegments = vi.fn((text: string) => ({
  segments: [text],
  widths: Array.from(text, () => 8), // ~8px per char
  lineEndFitAdvances: [],
  lineEndPaintAdvances: [],
  kinds: [],
  simpleLineWalkFastPath: true,
  segLevels: null,
  breakableWidths: [],
  breakablePrefixWidths: [],
  discretionaryHyphenWidth: 0,
  tabStopAdvance: 0,
  chunks: [],
  [Symbol.for('preparedTextBrand')]: true,
}));

const mockLayout = vi.fn((_prepared: unknown, maxWidth: number) => {
  const text = (_prepared as { segments: string[] }).segments.join('');
  const charWidth = 8;
  const totalWidth = text.length * charWidth;
  const lineCount = Math.max(1, Math.ceil(totalWidth / maxWidth));
  const height = lineCount > 0 ? 20 : 0;
  return { lineCount, height };
});

const mockLayoutWithLines = vi.fn((_prepared: unknown, maxWidth: number, lineHeight: number) => {
  const text = (_prepared as { segments: string[] }).segments.join('');
  const charWidth = 8;
  const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
  const lines: Array<{ text: string; width: number; start: { segmentIndex: number; graphemeIndex: number }; end: { segmentIndex: number; graphemeIndex: number } }> = [];

  for (let i = 0; i < text.length; i += charsPerLine) {
    const lineText = text.slice(i, i + charsPerLine);
    lines.push({
      text: lineText,
      width: lineText.length * charWidth,
      start: { segmentIndex: 0, graphemeIndex: i },
      end: { segmentIndex: 0, graphemeIndex: Math.min(i + charsPerLine, text.length) },
    });
  }

  const lineCount = lines.length;
  const height = lineCount * (lineHeight || 20);
  return { lineCount, height, lines };
});

const mockLayoutNextLine = vi.fn((_prepared: unknown, start: { segmentIndex: number; graphemeIndex: number }, maxWidth: number) => {
  const text = (_prepared as { segments: string[] }).segments.join('');
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
  layout: (...args: unknown[]) => mockLayout(...(args as [unknown, number])),
  layoutWithLines: (...args: unknown[]) => mockLayoutWithLines(...(args as [unknown, number, number])),
  layoutNextLine: (...args: unknown[]) => mockLayoutNextLine(...(args as [unknown, { segmentIndex: number; graphemeIndex: number }, number])),
}));

// Import our wrappers AFTER mock
import { measureLines, shapeText, fitLabel } from '../src/lib/pretext';

// Arbitrary for non-empty text strings
const textArb = fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0);
const widthArb = fc.integer({ min: 16, max: 2000 });

describe('Pretext property-based tests', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  it('forAll(text, width): layoutWithLines is deterministic', () => {
    fc.assert(
      fc.property(textArb, widthArb, (text, width) => {
        const lineHeight = 20;
        const result1 = measureLines(text, '16px system-ui', width, lineHeight);
        const result2 = measureLines(text, '16px system-ui', width, lineHeight);
        expect(result1.length).toBe(result2.length);
        for (let i = 0; i < result1.length; i++) {
          expect(result1[i].text).toBe(result2[i].text);
          expect(result1[i].width).toBe(result2[i].width);
        }
      }),
      { numRuns: 50 },
    );
  });

  it('forAll(text, w1 < w2): lineCount at w1 >= lineCount at w2', () => {
    fc.assert(
      fc.property(
        textArb,
        widthArb,
        widthArb,
        (text, w1, w2) => {
          const small = Math.min(w1, w2);
          const large = Math.max(w1, w2);
          if (small === large) return;
          const lineHeight = 20;
          const narrowLines = measureLines(text, '16px system-ui', small, lineHeight);
          const wideLines = measureLines(text, '16px system-ui', large, lineHeight);
          expect(narrowLines.length).toBeGreaterThanOrEqual(wideLines.length);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('forAll(text, width): concatenating line.text reconstructs original', () => {
    fc.assert(
      fc.property(textArb, widthArb, (text, width) => {
        const lineHeight = 20;
        const lines = measureLines(text, '16px system-ui', width, lineHeight);
        const reconstructed = lines.map((l) => l.text).join('');
        expect(reconstructed).toBe(text);
      }),
      { numRuns: 50 },
    );
  });

  it('shapeText produces lines for non-empty text', () => {
    fc.assert(
      fc.property(textArb, (text) => {
        const widths = [200, 200, 200, 400, 400];
        const lines = shapeText(text, '16px system-ui', widths, 20);
        expect(lines.length).toBeGreaterThan(0);
      }),
      { numRuns: 30 },
    );
  });

  it('fitLabel returns boolean', () => {
    fc.assert(
      fc.property(textArb, widthArb, (text, width) => {
        const result = fitLabel(text, '16px system-ui', width);
        expect(typeof result).toBe('boolean');
      }),
      { numRuns: 30 },
    );
  });
});
