import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getCellPosition,
  adjacencyMap,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../src/lib/grid';
import { allElements } from '../src/lib/data';

// Arbitrary that picks a random element from the dataset
const elementArb = fc.integer({ min: 0, max: allElements.length - 1 }).map((i) => allElements[i]);

describe('Property-based: grid layout', () => {
  it('forAll(element): grid position is unique', () => {
    const positions = new Map<string, string>();
    for (const el of allElements) {
      const pos = getCellPosition(el);
      const key = `${pos.x},${pos.y}`;
      expect(positions.has(key)).toBe(false);
      positions.set(key, el.symbol);
    }
  });

  it('forAll(element): position within viewBox bounds', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const pos = getCellPosition(el);
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.x + CELL_WIDTH).toBeLessThanOrEqual(VIEWBOX_W);
        expect(pos.y + CELL_HEIGHT).toBeLessThanOrEqual(VIEWBOX_H);
      }),
    );
  });

  it('forAll(two elements same period): same y', () => {
    fc.assert(
      fc.property(elementArb, elementArb, (a, b) => {
        if (a.symbol === b.symbol) return;
        const pa = getCellPosition(a);
        const pb = getCellPosition(b);
        // Same period should produce same row and thus same y
        if (pa.row === pb.row) {
          expect(pa.y).toBe(pb.y);
        }
      }),
    );
  });

  it('forAll(two elements same group): same x', () => {
    fc.assert(
      fc.property(elementArb, elementArb, (a, b) => {
        if (a.symbol === b.symbol) return;
        const pa = getCellPosition(a);
        const pb = getCellPosition(b);
        // Same column should produce same x
        if (pa.col === pb.col) {
          expect(pa.x).toBe(pb.x);
        }
      }),
    );
  });

  it('forAll(element): horizontal arrow navigation is reversible (left↔right)', () => {
    fc.assert(
      fc.property(elementArb, (el) => {
        const entry = adjacencyMap.get(el.symbol)!;
        // If we go right then left, we should get back
        if (entry.right) {
          const rightEntry = adjacencyMap.get(entry.right)!;
          expect(rightEntry.left).toBe(el.symbol);
        }
        // If we go left then right, we should get back
        if (entry.left) {
          const leftEntry = adjacencyMap.get(entry.left)!;
          expect(leftEntry.right).toBe(el.symbol);
        }
      }),
    );
  });

  it('forAll(element): all arrow directions lead to valid cell or no-op', () => {
    const validSymbols = new Set(allElements.map((e) => e.symbol));
    fc.assert(
      fc.property(elementArb, (el) => {
        const entry = adjacencyMap.get(el.symbol)!;
        expect(entry).toBeDefined();
        for (const dir of ['up', 'down', 'left', 'right'] as const) {
          const target = entry[dir];
          if (target !== null) {
            expect(validSymbols.has(target)).toBe(true);
          }
        }
      }),
    );
  });
});
