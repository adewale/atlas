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
