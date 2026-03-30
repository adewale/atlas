import { useMemo } from 'react';
import {
  measureLines,
  shapeText,
  dropCapLayout,
  computeLineHeight,
  PRETEXT_SANS,
  type PositionedLine,
} from '../lib/pretext';

const BODY_FONT = `16px ${PRETEXT_SANS}`;
const PLATE_HEIGHT = 180;

type UsePretextLinesOptions = {
  text: string;
  maxWidth: number;
  font?: string;
};

/**
 * Hook for Tier 1: simple measured text lines.
 */
export function usePretextLines({
  text,
  maxWidth,
  font = BODY_FONT,
}: UsePretextLinesOptions): { lines: PositionedLine[]; lineHeight: number } {
  return useMemo(() => {
    const lineHeight = computeLineHeight(font);
    const lines = measureLines(text, font, maxWidth, lineHeight);
    return { lines, lineHeight };
  }, [text, maxWidth, font]);
}

type UseShapedTextOptions = {
  text: string;
  fullWidth: number;
  narrowWidth: number;
  font?: string;
  mobile?: boolean;
  leftIndent?: { width: number; height: number };
};

type UseWedgeTextOptions = {
  text: string;
  minWidth: number;  // width of narrowest line (top)
  maxWidth: number;  // width of widest line (bottom)
  font?: string;
};

/**
 * Hook for V-shaped (wedge) text: lines get progressively wider
 * from minWidth at top to maxWidth at bottom.
 */
export function useWedgeText({
  text,
  minWidth,
  maxWidth,
  font = BODY_FONT,
}: UseWedgeTextOptions): { lines: PositionedLine[]; lineHeight: number } {
  const lh = useMemo(() => computeLineHeight(font), [font]);

  const lines = useMemo(() => {
    if (!text) return [];

    // Estimate line count using average width
    const avgWidth = (minWidth + maxWidth) / 2;
    const estimate = measureLines(text, font, avgWidth, lh);
    const numLines = Math.max(estimate.length, 2);

    // Create V-shaped width array: linearly interpolate from minWidth to maxWidth
    // Add extra entries so shapeText won't run out
    const widths = Array.from({ length: numLines + 5 }, (_, i) => {
      const t = numLines <= 1 ? 1 : i / (numLines - 1);
      return minWidth + Math.min(t, 1) * (maxWidth - minWidth);
    });

    return shapeText(text, font, widths, lh);
  }, [text, font, minWidth, maxWidth, lh]);

  return { lines, lineHeight: lh };
}

/**
 * Hook for Tier 2: shaped text that flows around the data plate.
 * Computes plateHeightInLines from Pretext font measurement at render time.
 */
export function useShapedText({
  text,
  fullWidth,
  narrowWidth,
  font = BODY_FONT,
  mobile = false,
  leftIndent,
}: UseShapedTextOptions): {
  lines: PositionedLine[];
  lineHeight: number;
  plateHeightInLines: number;
  identityHeightInLines: number;
} {
  return useMemo(() => {
    const lineHeight = computeLineHeight(font);
    const plateHeightInLines = Math.ceil(PLATE_HEIGHT / lineHeight);
    const identityHeightInLines = leftIndent
      ? Math.ceil(leftIndent.height / lineHeight)
      : 0;

    if (mobile) {
      const lines = measureLines(text, font, fullWidth, lineHeight);
      return { lines, lineHeight, plateHeightInLines, identityHeightInLines };
    }

    const leftW = leftIndent ? leftIndent.width : 0;
    const GAP = leftIndent ? 16 : 0;

    // Build width array accounting for both left identity block and right plate
    const widthPerLine: number[] = [];
    for (let i = 0; i < 200; i++) {
      const besidePlate = i < plateHeightInLines;
      const besideIdentity = i < identityHeightInLines;
      if (besideIdentity && besidePlate) {
        widthPerLine.push(narrowWidth - leftW - GAP);
      } else if (besidePlate) {
        widthPerLine.push(narrowWidth);
      } else if (besideIdentity) {
        widthPerLine.push(fullWidth - leftW - GAP);
      } else {
        widthPerLine.push(fullWidth);
      }
    }

    const lines = shapeText(text, font, widthPerLine, lineHeight);

    // Offset x for lines beside the identity block
    for (let i = 0; i < Math.min(identityHeightInLines, lines.length); i++) {
      lines[i].x = leftW + GAP;
    }

    return { lines, lineHeight, plateHeightInLines, identityHeightInLines };
  }, [text, fullWidth, narrowWidth, font, mobile, leftIndent?.width, leftIndent?.height]);
}

type UseDropCapOptions = {
  text: string;
  maxWidth: number;
  font?: string;
  dropCapFont?: string;
};

/**
 * Hook for Tier 2b: drop-cap text layout.
 * A large initial character with body text flowing around it.
 */
export function useDropCapText({
  text,
  maxWidth,
  font = BODY_FONT,
  dropCapFont = `48px ${PRETEXT_SANS}`,
}: UseDropCapOptions): {
  dropCap: { char: string; width: number; height: number; fontSize: number };
  lines: PositionedLine[];
  lineHeight: number;
} {
  return useMemo(() => {
    const lineHeight = computeLineHeight(font);
    if (!text) {
      return { dropCap: { char: '', width: 0, height: 0, fontSize: 0 }, lines: [], lineHeight };
    }
    const result = dropCapLayout(text, font, dropCapFont, maxWidth, lineHeight);
    return { ...result, lineHeight };
  }, [text, maxWidth, font, dropCapFont]);
}
