import { describe, it, expect } from 'vitest';
import { forEveryElement, forEveryElementPair } from './every-element';
import {
  getCellPosition,
  adjacencyMap,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../src/lib/grid';
import { allElements } from '../src/lib/data';


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
    forEveryElement(allElements, (el) => {
      const pos = getCellPosition(el);
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.x + CELL_WIDTH).toBeLessThanOrEqual(VIEWBOX_W);
      expect(pos.y + CELL_HEIGHT).toBeLessThanOrEqual(VIEWBOX_H);
    });
  });

  it('forAll(two elements same period): same y', () => {
    forEveryElementPair(allElements, (a, b) => {
      if (a.symbol === b.symbol) return;
      const pa = getCellPosition(a);
      const pb = getCellPosition(b);
      // Same period should produce same row and thus same y
      if (pa.row === pb.row) {
        expect(pa.y).toBe(pb.y);
      }
    });
  });

  it('forAll(two elements same group): same x', () => {
    forEveryElementPair(allElements, (a, b) => {
      if (a.symbol === b.symbol) return;
      const pa = getCellPosition(a);
      const pb = getCellPosition(b);
      // Same column should produce same x
      if (pa.col === pb.col) {
        expect(pa.x).toBe(pb.x);
      }
    });
  });

  it('forAll(element): horizontal arrow navigation is reversible (left↔right)', () => {
    forEveryElement(allElements, (el) => {
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
    });
  });

  it('forAll(element): all arrow directions lead to valid cell or no-op', () => {
    const validSymbols = new Set(allElements.map((e) => e.symbol));
    forEveryElement(allElements, (el) => {
      const entry = adjacencyMap.get(el.symbol)!;
      expect(entry).toBeDefined();
      for (const dir of ['up', 'down', 'left', 'right'] as const) {
        const target = entry[dir];
        if (target !== null) {
          expect(validSymbols.has(target)).toBe(true);
        }
      }
    });
  });
});
