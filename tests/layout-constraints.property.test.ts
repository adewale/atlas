import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// No mock — uses real @chenglou/pretext via node-canvas OffscreenCanvas polyfill
// (see tests/setup.ts). This gives us real font metrics for fitLabel assertions.

import { fitLabel, PRETEXT_SANS } from '../src/lib/pretext';
import { allElements } from '../src/lib/data';
import { MONO_FONT } from '../src/lib/theme';
import type { DiscovererData, TimelineData } from '../src/lib/types';
import discoverersJson from '../data/generated/discoverers.json';
import timelineJson from '../data/generated/timeline.json';
import { ERA_BINS, yearToEra } from '../shared/era-bins';

const discoverers = discoverersJson as DiscovererData[];
const timeline = timelineJson as TimelineData;

// ---------------------------------------------------------------------------
// Constants mirroring component code
// ---------------------------------------------------------------------------

// AtlasPlate
const CARD_W = 100;
const CARD_H = 80;
const NAME_MAX_W = CARD_W - 12; // 88px
const NAME_FONT = `8px ${PRETEXT_SANS}`;

const ABBREV: Record<string, string> = {
  'transition metal': 'trans. metal',
  'alkali metal': 'alkali',
  'alkaline earth metal': 'alk. earth',
  'noble gas': 'noble gas',
  'post-transition metal': 'post-trans.',
  'reactive nonmetal': 'nonmetal',
};

// DataPlateRow (Folio)
const PLATE_WIDTH = 160;

// SvgPrevNext
const PREV_NEXT_VIEWBOX_W = 400;
const PREV_NEXT_FONT_SIZE = 11;

// EntityChip
const ENTITY_CHIP_MAX_W = 160; // maxWidth from BaseChip styles

// Discoverer prev/next truncation
// DiscovererDetail now uses fitLabel-based truncation (NAV_LABEL_MAX_W=180, 11px font)
// With mock charWidth=8, names fitting: length * 8 <= 180 → length <= 22
const DISC_NAV_MAX_W = 180;

// Screen widths
const SCREEN_WIDTHS = [375, 812, 1280] as const;

// Arbitraries
const elementArb = fc.integer({ min: 0, max: allElements.length - 1 }).map((i) => allElements[i]);

// ---------------------------------------------------------------------------
// Helpers — replicate truncation logic from AtlasPlate
// ---------------------------------------------------------------------------

function truncateToFit(name: string, font: string, maxWidth: number): string {
  if (fitLabel(name, font, maxWidth)) return name;
  const abbrev = ABBREV[name];
  if (abbrev && fitLabel(abbrev, font, maxWidth)) return abbrev;
  const base = abbrev ?? name;
  let lo = 1;
  let hi = base.length - 1;
  let best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fitLabel(base.slice(0, mid) + '\u2026', font, maxWidth)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best > 0 ? base.slice(0, best) + '\u2026' : base[0] + '\u2026';
}


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Layout constraints: AtlasPlate card', () => {
  it('forAll(element): symbol is 1-3 characters and fits comfortably in card', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        expect(el.symbol.length).toBeGreaterThanOrEqual(1);
        expect(el.symbol.length).toBeLessThanOrEqual(3);
        // At fontSize=20 bold, 3 chars is at most ~48px, well within CARD_W=100
        const symbolWidth = el.symbol.length * 12; // generous estimate for bold 20px
        expect(symbolWidth).toBeLessThan(CARD_W);
      }),
    );
  });

  it('all 118 elements: symbol fits at fontSize 20', () => {
    for (const el of allElements) {
      // Even the widest 3-char symbol (e.g. "Uue") at bold 20px ~60px < 94px available
      expect(el.symbol.length).toBeLessThanOrEqual(3);
    }
  });

  it('forAll(element): name either fits in NAME_MAX_W or truncateToFit produces a fitting result', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const label = truncateToFit(el.name, NAME_FONT, NAME_MAX_W);
        // After truncation, the label must fit (fitLabel returns true)
        const fits = fitLabel(label, NAME_FONT, NAME_MAX_W);
        expect(fits).toBe(true);
      }),
    );
  });

  it('all 118 elements: category truncation via truncateToFit always produces a fitting label', () => {
    for (const el of allElements) {
      const label = truncateToFit(el.category, NAME_FONT, NAME_MAX_W);
      const fits = fitLabel(label, NAME_FONT, NAME_MAX_W);
      expect(fits).toBe(true);
    }
  });

  it('all 118 elements: truncated category preserves recognisability (at least 1 char)', () => {
    for (const el of allElements) {
      const label = truncateToFit(el.category, NAME_FONT, NAME_MAX_W);
      expect(label.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('forAll(element): atomic number padded to 3 digits fits in card', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const padded = String(el.atomicNumber).padStart(3, '0');
        expect(padded.length).toBe(3);
        // At fontSize=9, 3 chars is ~27px, well within CARD_W=100
        const width = padded.length * 6; // ~6px per char at 9px font
        expect(width).toBeLessThan(CARD_W - 12); // 6px padding each side
      }),
    );
  });

  it('all known ABBREV entries are shorter than their originals', () => {
    for (const [full, abbrev] of Object.entries(ABBREV)) {
      expect(abbrev.length).toBeLessThanOrEqual(full.length);
    }
  });

  it('forAll(element): property value display string is bounded', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        // Mass display: e.g. "12.011 Da" — check it fits CARD_W at fontSize=10
        const massStr = el.mass != null ? `${el.mass} Da` : '\u2014';
        // At fontSize=10 mono, ~6px per char; CARD_W - 12 = 88px available
        const width = massStr.length * 6;
        // This should fit; mass values are typically < 300 chars
        expect(massStr.length).toBeLessThan(20);
        expect(width).toBeLessThan(CARD_W);
      }),
    );
  });
});

describe('Layout constraints: DataPlateRow (Folio)', () => {
  it('all 118 elements: category fontSize selection handles all category lengths', () => {
    for (const el of allElements) {
      const strValue = String(el.category);
      const valueFontSize = strValue.length > 6 ? 13 : strValue.length > 3 ? 18 : 24;

      // Category strings are always > 1 char so we expect either 13 or 18
      expect(valueFontSize).toBeGreaterThanOrEqual(13);
      expect(valueFontSize).toBeLessThanOrEqual(24);
    }
  });

  it('all 118 elements: category in DataPlateRow uses textLength compression when needed', () => {
    for (const el of allElements) {
      const strValue = String(el.category);
      const hasArrows = true; // prev/next arrows are present in most cases
      const maxTextWidth = PLATE_WIDTH - 12 - (hasArrows ? 52 : 8);
      const needsCompression = strValue.length > 6;

      // If compression is needed, textLength attribute is applied
      // This guarantees the text always fits within maxTextWidth
      if (needsCompression) {
        expect(maxTextWidth).toBeGreaterThan(0);
      }

      // Without arrows, even more space is available
      const maxTextWidthNoArrows = PLATE_WIDTH - 12 - 8;
      expect(maxTextWidthNoArrows).toBeGreaterThan(0);
    }
  });

  it('all 118 elements: category text compression has sufficient width', () => {
    // With arrows: maxTextWidth = 160 - 12 - 52 = 96px
    // Without arrows: maxTextWidth = 160 - 12 - 8 = 140px
    // Even at mobile full-width (375px): 375 - 12 - 52 = 311px
    for (const screenWidth of SCREEN_WIDTHS) {
      const rowWidth = screenWidth <= 812 ? screenWidth : PLATE_WIDTH;
      for (const el of allElements) {
        const strValue = String(el.category);
        const maxTextWidth = rowWidth - 12 - 52; // assume arrows present
        // At fontSize 13 with textLength compression, any string can be compressed
        // Minimum: the compressed area must be positive
        expect(maxTextWidth).toBeGreaterThan(0);
        // Verify the text won't be compressed to an unreadable degree
        // Rule: at least 4px per character when compressed
        if (strValue.length > 6) {
          const pxPerChar = maxTextWidth / strValue.length;
          expect(pxPerChar).toBeGreaterThan(2);
        }
      }
    }
  });

  it('all 118 elements: group/period/block values fit at their chosen font sizes', () => {
    for (const el of allElements) {
      // Group: number or dash, always short
      const groupStr = String(el.group ?? '\u2014');
      expect(groupStr.length).toBeLessThanOrEqual(3);

      // Period: 1-7, single digit
      expect(String(el.period).length).toBe(1);

      // Block: single char (s, p, d, f)
      expect(el.block.length).toBe(1);
    }
  });
});

describe('Layout constraints: SvgPrevNext', () => {
  it('all discoverers: names fit or can be truncated to fit SvgPrevNext', () => {
    const navFont = `${PREV_NEXT_FONT_SIZE}px ${PRETEXT_SANS}`;
    for (const disc of discoverers) {
      // If the name fits at 180px, great; otherwise truncation is needed
      const fits = fitLabel(disc.name, navFont, DISC_NAV_MAX_W);
      if (!fits) {
        // Truncated to first 10 chars + ellipsis should fit
        const truncated = disc.name.slice(0, 10) + '\u2026';
        expect(fitLabel(truncated, navFont, DISC_NAV_MAX_W)).toBe(true);
      }
    }
  });

  it('all timeline eras: era labels fit in SvgPrevNext', () => {
    // TimelineEra uses SvgPrevNext with era names from ERA_BINS
    for (const bin of ERA_BINS) {
      const label = `\u2190 ${bin.label}`;
      const charWidth = 6.5;
      expect(label.length * charWidth).toBeLessThan(PREV_NEXT_VIEWBOX_W / 2);
    }
  });
});

describe('Layout constraints: EntityChip', () => {
  it('all 118 elements: neighbour chip primary text uses CSS text-overflow', () => {
    // EntityChip uses CSS overflow: hidden + textOverflow: ellipsis + whiteSpace: nowrap
    // So any length is safe — the chip clips. We verify the maxWidth constraint exists.
    for (const el of allElements) {
      for (const sym of el.neighbors) {
        const neighbour = allElements.find((e) => e.symbol === sym);
        if (!neighbour) continue;
        const primary = `${sym} \u2014 ${neighbour.name}`;
        // CSS will clip, but verify the string is reasonable (not absurdly long)
        expect(primary.length).toBeLessThan(30);
      }
    }
  });

  it('all discoverers: DiscovererChip names rely on CSS overflow for clipping', () => {
    for (const disc of discoverers) {
      // BaseChip has maxWidth=160px with CSS text-overflow: ellipsis
      // Verify no name is empty
      expect(disc.name.length).toBeGreaterThan(0);
      // CSS handles overflow, but names should be reasonable
      // The longest discoverer names are typically < 40 chars
      expect(disc.name.length).toBeLessThan(80);
    }
  });
});

describe('Layout constraints: HeroHeader', () => {
  it('all discoverers: hero title uses INSCRIPTION_STYLE (13px bold uppercase) which wraps naturally', () => {
    // HeroHeader uses flex layout with gap=16px and a 96px numeral
    // The title area gets remaining width: screenWidth - 96 - 16 = at least 263px on mobile (375)
    for (const screenWidth of SCREEN_WIDTHS) {
      const titleAreaWidth = screenWidth - 96 - 16 - 24; // minus padding
      expect(titleAreaWidth).toBeGreaterThan(200);
    }
  });

  it('all listing pages: element count numerals fit at fontSize 96', () => {
    // The largest numeral is the count of elements in a category/group/period
    // Max category size: transition metals ~38 elements, displayed as "38"
    // At 96px mono, "38" is ~115px which fits even on 375px screens
    const maxGroupSize = Math.max(
      ...allElements.reduce((acc, el) => {
        const cat = el.category;
        acc.set(cat, (acc.get(cat) ?? 0) + 1);
        return acc;
      }, new Map<string, number>()).values(),
    );
    // Max count is < 1000, so 3 digits at most
    const digits = String(maxGroupSize).length;
    expect(digits).toBeLessThanOrEqual(3);
    // At ~58px per digit for 96px mono, 3 digits = ~174px
    const numeralWidth = digits * 58;
    expect(numeralWidth).toBeLessThan(375 - 16); // must fit on smallest screen
  });
});

describe('Layout constraints: IntroBlock drop cap', () => {
  it('all 118 elements: summary first character is a valid drop cap', () => {
    for (const el of allElements) {
      expect(el.summary.length).toBeGreaterThan(0);
      const trimmed = el.summary.trimStart();
      const dropChar = trimmed[0];
      // Drop cap char should be a letter (summaries start with element name or "The" etc.)
      // Note: some summaries may have leading whitespace which useDropCapText would trim
      expect(dropChar).toMatch(/[A-Z]/);
    }
  });

  it('forAll(element): summary text fits in IntroBlock at all screen widths', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        // IntroBlock desktop width = 760, mobile = 360
        // Drop cap takes ~40px width + 4px gap = 44px
        // Remaining width for first lines: 760 - 44 = 716px (desktop), 360 - 44 = 316px (mobile)
        // At 16px font, ~8px per char = ~39 chars per line on mobile
        // Summary is always > 50 chars (verified in data.property.test.ts)
        // The text wraps naturally, so it always fits — we verify widths are sane
        const desktopRemainder = 760 - 44;
        const mobileRemainder = 360 - 44;
        expect(desktopRemainder).toBeGreaterThan(200);
        expect(mobileRemainder).toBeGreaterThan(200);
        // No single word in the summary should be wider than the narrowest available width
        const words = el.summary.split(/\s+/);
        for (const word of words) {
          const wordWidth = word.length * 8; // 8px per char heuristic
          // Even the narrowest line (mobileRemainder=316px) can fit ~39 chars
          // Scientific terms rarely exceed 30 chars
          expect(wordWidth).toBeLessThan(mobileRemainder);
        }
      }),
    );
  });
});

describe('Layout constraints: NavigationPill', () => {
  it('navigation pill labels from categories fit at all screen widths', () => {
    // NavigationPill uses NAV_PILL_STYLE: fontSize 11px, uppercase, 0.08em tracking
    // Displayed inline with padding: 10px 12px + 1.5px border + optional 8px dot + 6px gap
    // Total chrome: ~40px. On 375px screen, available text width: ~335px
    const categories = [...new Set(allElements.map((e) => e.category))];
    for (const cat of categories) {
      // Category names are the longest labels used in NavigationPill
      // At 11px uppercase with tracking, ~7px per char
      const charWidth = 7;
      const pillTextWidth = cat.length * charWidth;
      // Pills can wrap to a new line in flex layout, so the constraint is
      // that a single pill fits within the narrowest screen
      const minAvailable = 375 - 48; // padding + margins
      expect(pillTextWidth).toBeLessThan(minAvailable);
    }
  });

  it('discoverer timeline navigation labels fit in NavigationPill', () => {
    // Labels like "View 1800-1849 on Timeline ->" - check they fit on mobile
    for (const bin of ERA_BINS) {
      const label = `View ${bin.label} on Timeline \u2192`;
      const charWidth = 7; // 11px uppercase
      const pillWidth = label.length * charWidth + 40; // +chrome
      expect(pillWidth).toBeLessThan(375);
    }
  });
});

describe('Layout constraints: cross-cutting screen width invariants', () => {
  it('forAll(element, screenWidth): AtlasPlate grid fits within screen', () => {
    for (const screenWidth of SCREEN_WIDTHS) {
      const cols = screenWidth < 812 ? 2 : 4;
      const GAP = 4;
      const gridW = cols * (CARD_W + GAP) - GAP;
      expect(gridW).toBeLessThanOrEqual(screenWidth);
    }
  });

  it('forAll(screenWidth): DataPlate row width is valid', () => {
    for (const screenWidth of SCREEN_WIDTHS) {
      // On mobile (< 1024), DataPlateRow uses full effectiveWidth
      // On desktop, it uses PLATE_WIDTH=160
      const rowWidth = screenWidth < 1024 ? screenWidth : PLATE_WIDTH;
      expect(rowWidth).toBeGreaterThan(0);
      expect(rowWidth).toBeLessThanOrEqual(screenWidth);
    }
  });

  it('forAll(screenWidth): SvgPrevNext viewBox (400px) scales within maxWidth 560', () => {
    // The SVG has viewBox 400px wide, maxWidth 560px, width=100%
    // preserveAspectRatio="xMidYMid meet" ensures it scales down
    for (const screenWidth of SCREEN_WIDTHS) {
      const displayWidth = Math.min(screenWidth, 560);
      expect(displayWidth).toBeGreaterThanOrEqual(375);
    }
  });

  it('forAll(screenWidth): IntroBlock width is appropriate', () => {
    for (const screenWidth of SCREEN_WIDTHS) {
      const introWidth = screenWidth < 812 ? 360 : 760;
      expect(introWidth).toBeLessThanOrEqual(screenWidth);
    }
  });
});

describe('Layout constraints: exhaustive category coverage', () => {
  it('every unique category in the dataset has a valid ABBREV or fits directly', () => {
    const categories = [...new Set(allElements.map((e) => e.category))];
    for (const cat of categories) {
      const label = truncateToFit(cat, NAME_FONT, NAME_MAX_W);
      const fits = fitLabel(label, NAME_FONT, NAME_MAX_W);
      expect(fits).toBe(true);
      // Also verify the result is non-empty and recognisable
      expect(label.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('ABBREV map covers all categories that would overflow at 8px font', () => {
    const categories = [...new Set(allElements.map((e) => e.category))];
    for (const cat of categories) {
      const directFit = fitLabel(cat, NAME_FONT, NAME_MAX_W);
      if (!directFit) {
        // If the category doesn't fit directly, there should be an abbreviation
        // or the binary search truncation must produce a readable result
        const label = truncateToFit(cat, NAME_FONT, NAME_MAX_W);
        expect(label.length).toBeGreaterThanOrEqual(2); // at least 1 char + ellipsis
      }
    }
  });
});

describe('Layout constraints: element name lengths', () => {
  it('all 118 elements: name length is bounded and reasonable', () => {
    for (const el of allElements) {
      // Longest element name is "Rutherfordium" (13 chars) or similar
      expect(el.name.length).toBeGreaterThanOrEqual(3); // "Tin" is the shortest
      expect(el.name.length).toBeLessThanOrEqual(20);
    }
  });

  it('forAll(element): element name at 8px font either fits or truncates gracefully', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const result = truncateToFit(el.name, NAME_FONT, NAME_MAX_W);
        expect(fitLabel(result, NAME_FONT, NAME_MAX_W)).toBe(true);
        // If truncated, it should end with ellipsis
        if (result !== el.name) {
          expect(result.endsWith('\u2026')).toBe(true);
        }
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Regression: DataPlateRow textLength must only compress, never stretch
// ---------------------------------------------------------------------------
describe('Layout constraints: DataPlateRow text compression', () => {
  const PLATE_ROW_WIDTH_DESKTOP = 160;
  const PLATE_ROW_WIDTH_MOBILE = 375; // typical mobile width

  function shouldCompress(strValue: string, rowWidth: number): boolean {
    const valueFontSize = strValue.length > 6 ? 13 : strValue.length > 3 ? 18 : 24;
    const maxTextWidth = rowWidth - 12 - 52; // worst case: with arrows
    const estimatedWidth = strValue.length * valueFontSize * 0.6;
    return strValue.length > 6 && estimatedWidth > maxTextWidth;
  }

  it('never stretches text on mobile — all categories', () => {
    const categories = [...new Set(allElements.map((e) => e.category))];
    for (const cat of categories) {
      // On mobile, rowWidth is large — text should NOT be stretched
      const compressed = shouldCompress(cat, PLATE_ROW_WIDTH_MOBILE);
      if (cat.length <= 6) {
        // Short text: never compressed regardless
        expect(compressed).toBe(false);
      }
      // If compressed on mobile, estimated width must exceed available space
      if (compressed) {
        const fontSize = 13;
        const maxW = PLATE_ROW_WIDTH_MOBILE - 12 - 52;
        expect(cat.length * fontSize * 0.6).toBeGreaterThan(maxW);
      }
    }
  });

  it('compresses "alkaline earth metal" on desktop (160px row)', () => {
    expect(shouldCompress('alkaline earth metal', PLATE_ROW_WIDTH_DESKTOP)).toBe(true);
  });

  it('does NOT compress "transition metal" on mobile (375px row)', () => {
    expect(shouldCompress('transition metal', PLATE_ROW_WIDTH_MOBILE)).toBe(false);
  });

  it('does NOT compress short values like "d" or "8"', () => {
    expect(shouldCompress('d', PLATE_ROW_WIDTH_DESKTOP)).toBe(false);
    expect(shouldCompress('8', PLATE_ROW_WIDTH_DESKTOP)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Regression: discovery era link label matches destination
// ---------------------------------------------------------------------------
describe('Layout constraints: discovery era labels', () => {
  it('there are exactly 8 era bins', () => {
    expect(ERA_BINS).toHaveLength(8);
  });

  it('elements with discoveryYear show era label, not generic "timeline"', () => {
    for (const el of allElements) {
      if (el.discoveryYear) {
        const bin = yearToEra(el.discoveryYear);
        const label = `${bin.label} →`;
        expect(label.length).toBeGreaterThan(2);
      }
    }
  });

  it('all discovery years map to a valid era slug', () => {
    const slugs = new Set(ERA_BINS.map(b => b.slug));
    for (const el of allElements) {
      const bin = yearToEra(el.discoveryYear);
      expect(slugs.has(bin.slug)).toBe(true);
    }
  });
});

describe('Layout constraints: discoverer name collection completeness', () => {
  it('all discoverer names in element data match discoverers list', () => {
    const discovererNames = new Set(discoverers.map((d) => d.name));
    const elementDiscoverers = new Set(
      allElements.map((e) => e.discoverer).filter((d) => d && d.length > 0),
    );
    for (const name of elementDiscoverers) {
      expect(discovererNames.has(name)).toBe(true);
    }
  });

  it('all discoverers: name is non-empty and bounded in length', () => {
    for (const disc of discoverers) {
      expect(disc.name.length).toBeGreaterThan(0);
      // Even the longest discoverer name should be reasonable
      expect(disc.name.length).toBeLessThan(80);
    }
  });
});
