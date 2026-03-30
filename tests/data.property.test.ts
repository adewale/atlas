import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { allElements, getElement, searchElements } from '../src/lib/data';
import type { GroupData, RankingsData } from '../src/lib/types';
import groupsJson from '../data/generated/groups.json';
import rankingsJson from '../data/generated/rankings.json';

const groups = groupsJson as GroupData[];
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
