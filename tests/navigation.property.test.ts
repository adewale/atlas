import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { allElements } from '../src/lib/data';

const elementArb = fc.integer({ min: 0, max: allElements.length - 1 }).map((i) => allElements[i]);

/**
 * Helper: compute prev/next within a filtered, sorted subset of elements.
 * Returns { prev, next } for the given element within the subset.
 */
function findPrevNext(
  el: (typeof allElements)[number],
  filter: (e: (typeof allElements)[number]) => boolean,
  sort: (a: (typeof allElements)[number], b: (typeof allElements)[number]) => number,
) {
  const members = allElements.filter(filter).sort(sort);
  const idx = members.findIndex((e) => e.symbol === el.symbol);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? members[idx - 1] : null,
    next: idx < members.length - 1 ? members[idx + 1] : null,
  };
}

describe('Group navigation property tests', () => {
  it('forAll(element with group): prev-in-group has the same group', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        if (el.group == null) return; // skip lanthanides/actinides
        const { prev } = findPrevNext(
          el,
          (e) => e.group === el.group,
          (a, b) => a.period - b.period,
        );
        if (prev) {
          expect(prev.group).toBe(el.group);
        }
      }),
    );
  });

  it('forAll(element with group): next-in-group has the same group', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        if (el.group == null) return;
        const { next } = findPrevNext(
          el,
          (e) => e.group === el.group,
          (a, b) => a.period - b.period,
        );
        if (next) {
          expect(next.group).toBe(el.group);
        }
      }),
    );
  });

  it('forAll(element with group): group navigation is reversible', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        if (el.group == null) return;
        const members = allElements
          .filter((e) => e.group === el.group)
          .sort((a, b) => a.period - b.period || a.atomicNumber - b.atomicNumber);
        const idx = members.findIndex((e) => e.symbol === el.symbol);

        // If A's next is B, then B's prev should be A
        if (idx < members.length - 1) {
          const nextEl = members[idx + 1];
          const nextIdx = members.findIndex((e) => e.symbol === nextEl.symbol);
          expect(members[nextIdx - 1].symbol).toBe(el.symbol);
        }
        // If A's prev is B, then B's next should be A
        if (idx > 0) {
          const prevEl = members[idx - 1];
          const prevIdx = members.findIndex((e) => e.symbol === prevEl.symbol);
          expect(members[prevIdx + 1].symbol).toBe(el.symbol);
        }
      }),
    );
  });

  it('forAll(element with group): prev-in-group has a smaller or equal period', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        if (el.group == null) return;
        const { prev } = findPrevNext(
          el,
          (e) => e.group === el.group,
          (a, b) => a.period - b.period || a.atomicNumber - b.atomicNumber,
        );
        if (prev) {
          expect(prev.period).toBeLessThanOrEqual(el.period);
        }
      }),
    );
  });

  it('forAll(element with group): next-in-group has a larger or equal period', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        if (el.group == null) return;
        const { next } = findPrevNext(
          el,
          (e) => e.group === el.group,
          (a, b) => a.period - b.period || a.atomicNumber - b.atomicNumber,
        );
        if (next) {
          expect(next.period).toBeGreaterThanOrEqual(el.period);
        }
      }),
    );
  });
});

describe('Period navigation property tests', () => {
  it('forAll(element): prev-in-period has the same period', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const { prev } = findPrevNext(
          el,
          (e) => e.period === el.period,
          (a, b) => a.atomicNumber - b.atomicNumber,
        );
        if (prev) {
          expect(prev.period).toBe(el.period);
        }
      }),
    );
  });

  it('forAll(element): next-in-period has the same period', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const { next } = findPrevNext(
          el,
          (e) => e.period === el.period,
          (a, b) => a.atomicNumber - b.atomicNumber,
        );
        if (next) {
          expect(next.period).toBe(el.period);
        }
      }),
    );
  });

  it('forAll(element): period navigation is reversible', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const members = allElements
          .filter((e) => e.period === el.period)
          .sort((a, b) => a.atomicNumber - b.atomicNumber);
        const idx = members.findIndex((e) => e.symbol === el.symbol);

        if (idx < members.length - 1) {
          const nextEl = members[idx + 1];
          const nextIdx = members.findIndex((e) => e.symbol === nextEl.symbol);
          expect(members[nextIdx - 1].symbol).toBe(el.symbol);
        }
        if (idx > 0) {
          const prevEl = members[idx - 1];
          const prevIdx = members.findIndex((e) => e.symbol === prevEl.symbol);
          expect(members[prevIdx + 1].symbol).toBe(el.symbol);
        }
      }),
    );
  });
});

describe('Block navigation property tests', () => {
  it('forAll(element): prev-in-block has the same block', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const { prev } = findPrevNext(
          el,
          (e) => e.block === el.block,
          (a, b) => a.atomicNumber - b.atomicNumber,
        );
        if (prev) {
          expect(prev.block).toBe(el.block);
        }
      }),
    );
  });

  it('forAll(element): next-in-block has the same block', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const { next } = findPrevNext(
          el,
          (e) => e.block === el.block,
          (a, b) => a.atomicNumber - b.atomicNumber,
        );
        if (next) {
          expect(next.block).toBe(el.block);
        }
      }),
    );
  });

  it('forAll(element): block navigation is reversible', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const members = allElements
          .filter((e) => e.block === el.block)
          .sort((a, b) => a.atomicNumber - b.atomicNumber);
        const idx = members.findIndex((e) => e.symbol === el.symbol);

        if (idx < members.length - 1) {
          const nextEl = members[idx + 1];
          const nextIdx = members.findIndex((e) => e.symbol === nextEl.symbol);
          expect(members[nextIdx - 1].symbol).toBe(el.symbol);
        }
        if (idx > 0) {
          const prevEl = members[idx - 1];
          const prevIdx = members.findIndex((e) => e.symbol === prevEl.symbol);
          expect(members[prevIdx + 1].symbol).toBe(el.symbol);
        }
      }),
    );
  });

  it('block sizes sum to 118', () => {
    const blocks = ['s', 'p', 'd', 'f'];
    const total = blocks.reduce(
      (sum, b) => sum + allElements.filter((e) => e.block === b).length,
      0,
    );
    expect(total).toBe(118);
  });
});

describe('Cross-dimension navigation invariants', () => {
  it('every element has at least one navigable dimension', () => {
    for (const el of allElements) {
      const hasGroup = el.group != null;
      const hasPeriodNav = allElements.filter((e) => e.period === el.period).length > 1;
      const hasBlockNav = allElements.filter((e) => e.block === el.block).length > 1;
      expect(hasGroup || hasPeriodNav || hasBlockNav).toBe(true);
    }
  });

  it('group navigation never crosses periods out of order', () => {
    // Group 3 has multiple elements per period (La/Lu in P6, Ac/Lr in P7)
    // so we check >= rather than strict >
    const checked = new Set<number>();
    for (const el of allElements) {
      if (el.group == null || checked.has(el.group)) continue;
      checked.add(el.group);
      const members = allElements
        .filter((e) => e.group === el.group)
        .sort((a, b) => a.period - b.period || a.atomicNumber - b.atomicNumber);
      for (let i = 1; i < members.length; i++) {
        expect(members[i].period).toBeGreaterThanOrEqual(members[i - 1].period);
      }
    }
  });

  it('period navigation never decreases atomic number', () => {
    const periods = [1, 2, 3, 4, 5, 6, 7];
    for (const p of periods) {
      const members = allElements
        .filter((e) => e.period === p)
        .sort((a, b) => a.atomicNumber - b.atomicNumber);
      for (let i = 1; i < members.length; i++) {
        expect(members[i].atomicNumber).toBeGreaterThan(members[i - 1].atomicNumber);
      }
    }
  });
});
