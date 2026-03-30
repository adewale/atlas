import { useMemo } from 'react';
import {
  measureLines,
  shapeText,
  computeLineHeight,
  type PositionedLine,
} from '../lib/pretext';

const BODY_FONT = '16px system-ui';
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
}: UseShapedTextOptions): {
  lines: PositionedLine[];
  lineHeight: number;
  plateHeightInLines: number;
} {
  return useMemo(() => {
    const lineHeight = computeLineHeight(font);
    const plateHeightInLines = Math.ceil(PLATE_HEIGHT / lineHeight);

    if (mobile) {
      const lines = measureLines(text, font, fullWidth, lineHeight);
      return { lines, lineHeight, plateHeightInLines };
    }

    // Build width array: narrow for lines beside plate, full for lines below
    const widthPerLine: number[] = [];
    // Generous max lines estimate
    for (let i = 0; i < 200; i++) {
      widthPerLine.push(i < plateHeightInLines ? narrowWidth : fullWidth);
    }

    const lines = shapeText(text, font, widthPerLine, lineHeight);
    return { lines, lineHeight, plateHeightInLines };
  }, [text, fullWidth, narrowWidth, font, mobile]);
}
