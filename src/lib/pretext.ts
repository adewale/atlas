import {
  prepareWithSegments,
  layout,
  layoutWithLines,
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutLine,
  type LayoutCursor,
} from '@chenglou/pretext';

export type PositionedLine = {
  text: string;
  width: number;
  x: number;
  y: number;
};

const DEFAULT_FONT = '16px system-ui';

/**
 * Tier 1: Measure text into positioned lines for SVG rendering.
 */
export function measureLines(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
): PositionedLine[] {
  const prepared = prepareWithSegments(text, font);
  const result = layoutWithLines(prepared, maxWidth, lineHeight);
  return result.lines.map((line, i) => ({
    text: line.text,
    width: line.width,
    x: 0,
    y: i * lineHeight,
  }));
}

/**
 * Tier 2: Shaped text with variable width per line.
 * Used in folios to flow text around the data plate.
 */
export function shapeText(
  text: string,
  font: string,
  widthPerLine: number[],
  lineHeight: number,
): PositionedLine[] {
  const prepared = prepareWithSegments(text, font);
  const lines: PositionedLine[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

  for (let i = 0; ; i++) {
    const maxWidth = i < widthPerLine.length
      ? widthPerLine[i]
      : widthPerLine[widthPerLine.length - 1];
    const line = layoutNextLine(prepared, cursor, maxWidth);
    if (!line) break;
    lines.push({
      text: line.text,
      width: line.width,
      x: 0,
      y: i * lineHeight,
    });
    cursor = line.end;
  }
  return lines;
}

/**
 * Tier 3: Check if a label fits within a given width.
 */
export function fitLabel(
  text: string,
  font: string,
  maxWidth: number,
): boolean {
  const prepared = prepareWithSegments(text, font);
  const result = layout(prepared, maxWidth, 0);
  return result.lineCount <= 1;
}

/**
 * Compute the line height from the font size.
 * Uses a 1.2× multiplier (standard browser default line-height).
 * The previous approach — layout(ref, 9999, 0) — always returned 0
 * because pretext's layout returns lineCount × lineHeight.
 */
export function computeLineHeight(font: string = DEFAULT_FONT): number {
  const match = font.match(/(\d+(?:\.\d+)?)px/);
  const fontSize = match ? parseFloat(match[1]) : 16;
  return Math.ceil(fontSize * 1.2);
}

export { prepareWithSegments, layout, layoutWithLines, layoutNextLine };
export type { LayoutLine, PreparedTextWithSegments, LayoutCursor };
