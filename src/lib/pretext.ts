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

export const PRETEXT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const DROP_CAP_FONT = 'Cinzel, Georgia, serif';

const DEFAULT_FONT = `16px ${PRETEXT_SANS}`;

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

/**
 * Tier 2b: Drop-cap text layout.
 * Measures a large initial character separately, then flows the remaining text
 * around it using variable-width lines (narrower beside the drop cap, full after).
 */
export function dropCapLayout(
  text: string,
  font: string,
  dropCapFont: string,
  maxWidth: number,
  lineHeight: number,
): {
  dropCap: { char: string; width: number; height: number; fontSize: number };
  lines: PositionedLine[];
} {
  if (!text || text.length === 0) {
    return { dropCap: { char: '', width: 0, height: 0, fontSize: 0 }, lines: [] };
  }

  // Extract the first character and the rest
  const dropChar = text[0];
  const restText = text.slice(1);

  // Measure the drop cap character at its large font size
  const dropPrepared = prepareWithSegments(dropChar, dropCapFont);
  layout(dropPrepared, 9999, 0);
  // For a single char, the prepared segments[0] width is the character width
  const dropWidth = dropPrepared.widths[0] ?? 40;

  // Parse drop cap font size
  const match = dropCapFont.match(/(\d+(?:\.\d+)?)px/);
  const dropFontSize = match ? parseFloat(match[1]) : 48;
  // Cap height is ~75% of font size for most serif fonts (Cinzel etc.)
  const dropHeight = Math.ceil(dropFontSize * 0.75);

  // How many body lines the drop cap spans
  const dropCapLines = Math.ceil(dropHeight / lineHeight);
  const gap = 4; // tight space between drop cap and body text

  // Build variable-width array: narrow beside drop cap, full after
  const narrowWidth = maxWidth - dropWidth - gap;
  const widths: number[] = [];
  for (let i = 0; i < 200; i++) {
    widths.push(i < dropCapLines ? narrowWidth : maxWidth);
  }

  // Layout the rest of the text with variable widths
  const lines = shapeText(restText, font, widths, lineHeight);

  // Offset x for lines beside the drop cap
  for (let i = 0; i < Math.min(dropCapLines, lines.length); i++) {
    lines[i].x = dropWidth + gap;
  }

  return {
    dropCap: { char: dropChar, width: dropWidth, height: dropHeight, fontSize: dropFontSize },
    lines,
  };
}

export { prepareWithSegments, layout, layoutWithLines, layoutNextLine };
export type { LayoutLine, PreparedTextWithSegments, LayoutCursor };
