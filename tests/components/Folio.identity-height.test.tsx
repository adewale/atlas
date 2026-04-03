/**
 * Folio identity block height invariant test.
 *
 * The IDENTITY_HEIGHT constant tells the text-shaping algorithm how many
 * lines of SVG text to indent beside the identity block. If IDENTITY_HEIGHT
 * is smaller than the identity block's actual rendered height, SVG text
 * lines at y-positions below IDENTITY_HEIGHT will start at x=0 and
 * overlap the bottom of the identity block (which is position:absolute).
 *
 * These tests verify the invariant:
 *   IDENTITY_HEIGHT >= sum of identity content heights on desktop
 */
import { describe, it, expect } from 'vitest';

// We can't import private constants from Folio.tsx, so we duplicate them
// here and the test verifies the math. If the component changes, this
// test must be updated — that's intentional, it's a regression guard.

// Current desktop identity block layout:
const FOLIO_NUMBER_FONT_SIZE = 48;  // fontSize on desktop
const FOLIO_NUMBER_LINE_HEIGHT = 1; // lineHeight
const FOLIO_SYMBOL_FONT_SIZE = 36;  // fontSize on desktop
const FOLIO_SYMBOL_LINE_HEIGHT = 1.1;
const FOLIO_NAME_FONT_SIZE = 10;    // fontSize
const FOLIO_NAME_MARGIN_TOP = 2;    // margin-top
const FOLIO_NAME_LINE_HEIGHT = 1.5; // browser default for block text

// The IDENTITY_HEIGHT constant from Folio.tsx
const IDENTITY_HEIGHT = 106;
const IDENTITY_WIDTH = 120;

describe('Folio identity block height invariant', () => {
  it('IDENTITY_HEIGHT covers the actual rendered identity content', () => {
    const numberHeight = FOLIO_NUMBER_FONT_SIZE * FOLIO_NUMBER_LINE_HEIGHT;
    const symbolHeight = FOLIO_SYMBOL_FONT_SIZE * FOLIO_SYMBOL_LINE_HEIGHT;
    const nameHeight = FOLIO_NAME_FONT_SIZE * FOLIO_NAME_LINE_HEIGHT + FOLIO_NAME_MARGIN_TOP;
    const totalContentHeight = numberHeight + symbolHeight + nameHeight;

    // The invariant: IDENTITY_HEIGHT must be >= actual content height
    // If this fails, SVG text will overlap the identity block
    expect(
      IDENTITY_HEIGHT,
      `IDENTITY_HEIGHT (${IDENTITY_HEIGHT}) must be >= rendered identity height (${totalContentHeight}). ` +
      `Breakdown: number=${numberHeight} + symbol=${symbolHeight} + name=${nameHeight}`
    ).toBeGreaterThanOrEqual(totalContentHeight);
  });

  it('IDENTITY_HEIGHT does not over-reserve lines (max 2 extra lines)', () => {
    // If IDENTITY_HEIGHT is much larger than content, too many text lines
    // get squeezed into the narrow channel between identity and data plate.
    // Allow at most 2 extra lines (40px at 20px lineHeight).
    const numberHeight = FOLIO_NUMBER_FONT_SIZE * FOLIO_NUMBER_LINE_HEIGHT;
    const symbolHeight = FOLIO_SYMBOL_FONT_SIZE * FOLIO_SYMBOL_LINE_HEIGHT;
    const nameHeight = FOLIO_NAME_FONT_SIZE * FOLIO_NAME_LINE_HEIGHT + FOLIO_NAME_MARGIN_TOP;
    const totalContentHeight = numberHeight + symbolHeight + nameHeight;

    const LINE_HEIGHT = 20; // approximate Pretext line height
    const extraLines = Math.ceil(IDENTITY_HEIGHT / LINE_HEIGHT) - Math.ceil(totalContentHeight / LINE_HEIGHT);
    expect(
      extraLines,
      `IDENTITY_HEIGHT reserves ${extraLines} extra line(s) beyond content — max 2 allowed`
    ).toBeLessThanOrEqual(2);
  });

  it('IDENTITY_WIDTH is wide enough for 3-digit atomic number at 48px mono', () => {
    // At 48px monospace, each character is roughly 28.8px wide (0.6em).
    // "077" = 3 chars ≈ 87px. Need some padding.
    const approxWidth = 3 * 48 * 0.6;
    expect(IDENTITY_WIDTH).toBeGreaterThanOrEqual(approxWidth);
  });

  it('narrow text channel between identity and plate is at least 180px', () => {
    // At desktop FULL_WIDTH=560, narrowWidth = 560 - 160 - 24 = 376
    // Channel = narrowWidth - IDENTITY_WIDTH - 16 (gap)
    const FULL_WIDTH = 560;
    const PLATE_WIDTH = 160;
    const PLATE_GAP = 24;
    const narrowWidth = FULL_WIDTH - PLATE_WIDTH - PLATE_GAP;
    const channel = narrowWidth - IDENTITY_WIDTH - 16;
    expect(
      channel,
      `Text channel (${channel}px) too narrow for readable text`
    ).toBeGreaterThanOrEqual(180);
  });
});
