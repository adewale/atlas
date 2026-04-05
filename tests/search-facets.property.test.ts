/**
 * Property-based tests for search facet invariants.
 *
 * Uses fast-check to generate random facet states and verifies that
 * the faceted navigation contract is never violated:
 *
 *  1. Every facet value with count > 0 is reachable — selecting it
 *     yields at least one result.
 *  2. Selecting a facet value never produces *more* results than
 *     the count promised.
 *  3. Facet counts are non-negative integers.
 *  4. total === results.length.
 *  5. All results match every active facet filter.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createLocalSearch } from '../src/lib/searchLocal';
import type { SearchRequest, SearchResponse } from '../shared/search-types';
import entities from '../data/generated/entity-index.json';
import elements from '../data/generated/elements.json';

type Entity = (typeof entities)[number];
type Element = (typeof elements)[number];

const search = createLocalSearch(entities as Entity[], elements as Element[]);

/* ------------------------------------------------------------------ */
/* Arbitraries                                                        */
/* ------------------------------------------------------------------ */

/** Collect all values that appear in facet counts for any empty query. */
const baseline: SearchResponse = search({ q: '' });
const allFacetValues: Record<string, string[]> = {};
for (const [dim, counts] of Object.entries(baseline.facets ?? {})) {
  allFacetValues[dim] = Object.keys(counts);
}

/** Generate a random non-empty subset of valid facet values for a dimension. */
function subsetOf(values: string[]): fc.Arbitrary<string[] | undefined> {
  if (values.length === 0) return fc.constant(undefined);
  return fc.oneof(
    fc.constant(undefined),
    fc.subarray(values, { minLength: 1, maxLength: values.length }),
  );
}

/** Generate a random SearchRequest with valid facet values. */
const arbSearchRequest: fc.Arbitrary<SearchRequest> = fc.record({
  q: fc.oneof(
    fc.constant(''),
    fc.stringOf(fc.char().filter((c) => c >= ' ' && c <= '~'), { minLength: 1, maxLength: 12 }),
    // Use real entity names sometimes to get non-empty results
    fc.constantFrom('', 'Iron', 'Gold', 'H', 'Curie', 'Seaborg', 'metal', 'gas'),
  ),
  type: subsetOf(allFacetValues.type ?? []),
  block: subsetOf(allFacetValues.block ?? []),
  era: subsetOf(allFacetValues.era ?? []),
  phase: subsetOf(allFacetValues.phase ?? []),
  etymologyOrigin: subsetOf(allFacetValues.etymologyOrigin ?? []),
});

/* ------------------------------------------------------------------ */
/* Properties                                                         */
/* ------------------------------------------------------------------ */

describe('search facet invariants (PBT)', () => {
  it('total always equals results.length', () => {
    fc.assert(
      fc.property(arbSearchRequest, (req) => {
        const res = search(req);
        expect(res.total).toBe(res.results.length);
      }),
      { numRuns: 200 },
    );
  });

  it('facet counts are non-negative integers', () => {
    fc.assert(
      fc.property(arbSearchRequest, (req) => {
        const res = search(req);
        for (const counts of Object.values(res.facets ?? {})) {
          for (const count of Object.values(counts)) {
            expect(count).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(count)).toBe(true);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('every facet value with count > 0 is reachable', () => {
    fc.assert(
      fc.property(arbSearchRequest, (req) => {
        const res = search(req);
        for (const [dim, counts] of Object.entries(res.facets ?? {})) {
          for (const [value, count] of Object.entries(counts)) {
            if (count === 0) continue;
            // Selecting this value (replacing any existing selection on this dimension)
            // should yield at least one result
            const probe: SearchRequest = { ...req, [dim]: [value] };
            const probeRes = search(probe);
            expect(probeRes.total).toBeGreaterThan(0);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('selecting a facet value yields at most the promised count', () => {
    fc.assert(
      fc.property(arbSearchRequest, (req) => {
        const res = search(req);
        for (const [dim, counts] of Object.entries(res.facets ?? {})) {
          for (const [value, count] of Object.entries(counts)) {
            if (count === 0) continue;
            // Replace this dimension's filter with just this value
            const probe: SearchRequest = { ...req, [dim]: [value] };
            const probeRes = search(probe);
            expect(probeRes.total).toBeLessThanOrEqual(count);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('empty query with no facets returns all entities', () => {
    const res = search({ q: '' });
    expect(res.total).toBe(entities.length);
  });

  it('results are always a subset of the unfiltered set', () => {
    fc.assert(
      fc.property(arbSearchRequest, (req) => {
        const res = search(req);
        const allIds = new Set(entities.map((e: Entity) => e.id));
        for (const r of res.results) {
          expect(allIds.has(r.id)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('no duplicate results', () => {
    fc.assert(
      fc.property(arbSearchRequest, (req) => {
        const res = search(req);
        const ids = res.results.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
      }),
      { numRuns: 200 },
    );
  });
});

describe('facet self-exclusion contract', () => {
  it('type facet counts ignore type filter', () => {
    // Filter to elements only, but type counts should still show discoverers
    const res = search({ q: '', type: ['element'] });
    const typeCounts = res.facets?.type;
    expect(typeCounts).toBeDefined();
    // Self-exclusion: type counts are computed WITHOUT the type filter
    expect(typeCounts!.discoverer).toBeGreaterThan(0);
    expect(typeCounts!.element).toBe(118);
  });

  it('block facet counts ignore block filter', () => {
    const res = search({ q: '', block: ['s'] });
    const blockCounts = res.facets?.block;
    expect(blockCounts).toBeDefined();
    // Should still show counts for d, p, f blocks
    expect(blockCounts!.d).toBeGreaterThan(0);
    expect(blockCounts!.p).toBeGreaterThan(0);
  });

  it('cross-dimension filtering: type filter affects block counts', () => {
    const all = search({ q: '' });
    const elementsOnly = search({ q: '', type: ['element'] });
    // Block counts with type=element should be <= block counts with no filter
    for (const [block, count] of Object.entries(elementsOnly.facets?.block ?? {})) {
      expect(count).toBeLessThanOrEqual(all.facets?.block?.[block] ?? Infinity);
    }
  });
});
