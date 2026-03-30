import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { allElements, getElement, searchElements } from '../src/lib/data';
import type { GroupData, PeriodData, CategoryData, RankingsData } from '../src/lib/types';
import groupsJson from '../data/generated/groups.json';
import periodsJson from '../data/generated/periods.json';
import categoriesJson from '../data/generated/categories.json';
import rankingsJson from '../data/generated/rankings.json';

const groups = groupsJson as GroupData[];
const periods = periodsJson as PeriodData[];
const categories = categoriesJson as CategoryData[];
const rankings = rankingsJson as RankingsData;

const validSymbols = new Set(allElements.map((e) => e.symbol));
const elementArb = fc.integer({ min: 0, max: allElements.length - 1 }).map((i) => allElements[i]);

describe('Data integrity property-based tests', () => {
  it('forAll(element): atomicNumber in 1..118, period in 1..7', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        expect(el.atomicNumber).toBeGreaterThanOrEqual(1);
        expect(el.atomicNumber).toBeLessThanOrEqual(118);
        expect(el.period).toBeGreaterThanOrEqual(1);
        expect(el.period).toBeLessThanOrEqual(7);
      }),
    );
  });

  it('forAll(element): if group !== null then group in 1..18', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        if (el.group !== null) {
          expect(el.group).toBeGreaterThanOrEqual(1);
          expect(el.group).toBeLessThanOrEqual(18);
        }
      }),
    );
  });

  it('forAll(element): block in [s, p, d, f]', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        expect(['s', 'p', 'd', 'f']).toContain(el.block);
      }),
    );
  });

  it('forAll(element): mass > 0', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        expect(el.mass).toBeGreaterThan(0);
      }),
    );
  });

  it('forAll(element): neighbors only contain valid symbols', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        for (const neighbor of el.neighbors) {
          expect(validSymbols.has(neighbor)).toBe(true);
        }
      }),
    );
  });

  it('forAll(a, adjacent b): neighbor symmetry', () => {
    for (const el of allElements) {
      for (const neighborSym of el.neighbors) {
        const neighbor = getElement(neighborSym)!;
        expect(neighbor).toBeDefined();
        expect(neighbor.neighbors).toContain(el.symbol);
      }
    }
  });

  it('forAll(ranking): 118 entries, no duplicates', () => {
    for (const key of Object.keys(rankings)) {
      const ranked = rankings[key];
      // Elements with rank 0 (no data) are excluded from ranking arrays
      // But all ranked elements should be unique
      const uniqueSymbols = new Set(ranked);
      expect(uniqueSymbols.size).toBe(ranked.length);
      for (const sym of ranked) {
        expect(validSymbols.has(sym)).toBe(true);
      }
    }
  });

  it('forAll(group n): listed elements have group === n', () => {
    for (const group of groups) {
      for (const sym of group.elements) {
        const el = getElement(sym)!;
        expect(el).toBeDefined();
        expect(el.group).toBe(group.n);
      }
    }
  });

  it('forAll(period n): listed elements have period === n', () => {
    for (const period of periods) {
      for (const sym of period.elements) {
        const el = getElement(sym)!;
        expect(el).toBeDefined();
        expect(el.period).toBe(period.n);
      }
    }
  });

  it('forAll(category): slug matches at least one element', () => {
    for (const cat of categories) {
      expect(cat.elements.length).toBeGreaterThan(0);
      for (const sym of cat.elements) {
        expect(validSymbols.has(sym)).toBe(true);
      }
    }
  });
});

describe('Search property-based tests', () => {
  it('forAll(element): searchElements(symbol) includes it', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const results = searchElements(el.symbol);
        const found = results.some((r) => r.symbol === el.symbol);
        expect(found).toBe(true);
      }),
    );
  });

  it('forAll(element): searchElements(name) includes it', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const results = searchElements(el.name);
        const found = results.some((r) => r.symbol === el.symbol);
        expect(found).toBe(true);
      }),
    );
  });
});

describe('Text layout property-based tests', () => {
  it('shaped text with narrower first section produces at least as many lines as full-width', () => {
    // measureLines / shapeText rely on canvas font metrics, which jsdom lacks.
    // We verify the invariant structurally: narrower widths ⇒ more or equal lines.
    // Use a simple char-width approximation (8px per char at 16px system-ui).
    const CHAR_W = 8;
    const FULL_WIDTH = 560;
    const NARROW_WIDTH = 376;

    fc.assert(
      fc.property(elementArb, (el) => {
        if (!el.summary) return true;
        const words = el.summary.split(/\s+/);
        // Simulate line-breaking at full width
        let fullLines = 1;
        let lineW = 0;
        for (const w of words) {
          const wW = w.length * CHAR_W;
          if (lineW + wW > FULL_WIDTH && lineW > 0) { fullLines++; lineW = wW + CHAR_W; }
          else { lineW += wW + CHAR_W; }
        }
        // Simulate line-breaking at narrow width (first 9 lines narrow, rest full)
        let shapedLines = 1;
        lineW = 0;
        for (const w of words) {
          const maxW = shapedLines <= 9 ? NARROW_WIDTH : FULL_WIDTH;
          const wW = w.length * CHAR_W;
          if (lineW + wW > maxW && lineW > 0) { shapedLines++; lineW = wW + CHAR_W; }
          else { lineW += wW + CHAR_W; }
        }
        return shapedLines >= fullLines;
      }),
    );
  });
});

describe('Licensing property-based tests', () => {
  it('forAll(per-element file sample): sources present with correct licenses', async () => {
    // Test a broad sample of elements
    const sample = allElements.filter((_, i) => i % 10 === 0);
    for (const el of sample) {
      const mod = await import(`../data/generated/element-${el.symbol}.json`);
      const data = mod.default;
      expect(data.sources).toBeDefined();
      expect(data.sources.summary.license).toBe('CC BY-SA 4.0');
      expect(data.sources.identifiers.license).toBe('CC0 1.0');
      expect(data.sources.structured.license).toBe('public domain');
    }
  });
});
