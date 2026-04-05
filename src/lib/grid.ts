import { allElements } from './data';
import type { ElementRecord } from './types';

// Re-export colour utilities so existing `import { blockColor } from './grid'`
// callers keep working. New code should import from './gridColors' directly
// to avoid pulling in allElements.
export { blockColor, contrastTextColor } from './gridColors';

// ---------------------------------------------------------------------------
// Cell position calculator — IUPAC 18-column layout
// ---------------------------------------------------------------------------
export type CellPosition = { col: number; row: number; x: number; y: number };

const CELL_W = 56;
const CELL_H = 64;
const GAP_BEFORE_FBLOCK = CELL_H; // gap between period 7 and f-block rows

/**
 * Map every element to its visual grid position.
 * Main grid: rows 1-7, cols 1-18.
 * Lanthanide row (Ce-Lu): row 9, cols 4-17.
 * Actinide row (Th-Lr): row 10, cols 4-17.
 */
function computePosition(el: ElementRecord): CellPosition {
  // f-block elements without a group go to the separated rows
  if (el.group === null) {
    // Lanthanides: Ce(58)–Yb(70) → 13 elements
    if (el.period === 6) {
      const col = 4 + (el.atomicNumber - 58); // Ce=4, Pr=5, … Yb=16
      return { col, row: 9, x: (col - 1) * CELL_W, y: 8 * CELL_H + GAP_BEFORE_FBLOCK };
    }
    // Actinides: Th(90)–No(102) → 13 elements
    const col = 4 + (el.atomicNumber - 90); // Th=4, Pa=5, … No=16
    return { col, row: 10, x: (col - 1) * CELL_W, y: 9 * CELL_H + GAP_BEFORE_FBLOCK };
  }

  // Lu(71) and Lr(103) have group=3 in data but we place them at end of f-block rows
  if (el.atomicNumber === 71) {
    const col = 17; // after Yb(col 16)
    return { col, row: 9, x: (col - 1) * CELL_W, y: 8 * CELL_H + GAP_BEFORE_FBLOCK };
  }
  if (el.atomicNumber === 103) {
    const col = 17;
    return { col, row: 10, x: (col - 1) * CELL_W, y: 9 * CELL_H + GAP_BEFORE_FBLOCK };
  }

  // Standard main grid
  const col = el.group;
  const row = el.period;
  return { col, row, x: (col - 1) * CELL_W, y: (row - 1) * CELL_H };
}

// Pre-compute all positions
const positionsBySymbol = new Map<string, CellPosition>();
const positionsByKey = new Map<string, string>(); // "row,col" -> symbol

for (const el of allElements) {
  const pos = computePosition(el);
  positionsBySymbol.set(el.symbol, pos);
  positionsByKey.set(`${pos.row},${pos.col}`, el.symbol);
}

export function getCellPosition(element: ElementRecord): CellPosition {
  return positionsBySymbol.get(element.symbol)!;
}

export function getSymbolAt(row: number, col: number): string | undefined {
  return positionsByKey.get(`${row},${col}`);
}

// ---------------------------------------------------------------------------
// SVG viewBox dimensions
// ---------------------------------------------------------------------------
export const VIEWBOX_W = 18 * CELL_W;
export const VIEWBOX_H = 9 * CELL_H + GAP_BEFORE_FBLOCK + CELL_H; // 10 rows + gap
export const CELL_WIDTH = CELL_W;
export const CELL_HEIGHT = CELL_H;

// ---------------------------------------------------------------------------
// Adjacency map — pre-computed static lookup for keyboard nav
// ---------------------------------------------------------------------------
export type Direction = 'up' | 'down' | 'left' | 'right';
export type AdjacencyEntry = Record<Direction, string | null>;

function findInDirection(
  startRow: number,
  startCol: number,
  dRow: number,
  dCol: number,
): string | null {
  let r = startRow + dRow;
  let c = startCol + dCol;
  while (r >= 1 && r <= 10 && c >= 1 && c <= 18) {
    // Skip row 8 (gap)
    if (r === 8) {
      r += dRow;
      continue;
    }
    const sym = getSymbolAt(r, c);
    if (sym) return sym;
    // For horizontal movement, keep scanning
    if (dCol !== 0) {
      c += dCol;
    } else {
      // For vertical, stop if no element at this column in this row
      break;
    }
  }
  return null;
}

function computeAdjacency(el: ElementRecord): AdjacencyEntry {
  const pos = getCellPosition(el);
  const { row, col } = pos;

  const entry: AdjacencyEntry = { up: null, down: null, left: null, right: null };

  // Left/right: scan within same row
  entry.left = findInDirection(row, col, 0, -1);
  entry.right = findInDirection(row, col, 0, 1);

  // Up/down: special handling for f-block rows
  if (row === 9) {
    // Lanthanide row
    // Up: go to period 6. Spec: Ce→La, Lu→Hf, middle→same col in period 6
    if (el.atomicNumber === 58) {
      // Ce → La (group 3, period 6)
      entry.up = 'La';
    } else if (el.atomicNumber === 71) {
      // Lu → Hf (group 4, period 6)
      entry.up = 'Hf';
    } else {
      // Middle lanthanides: go to period 6, same column
      entry.up = getSymbolAt(6, col) ?? null;
    }
    // Down: go to actinide at same col
    entry.down = getSymbolAt(10, col) ?? null;
  } else if (row === 10) {
    // Actinide row
    // Up: go to period 7. Spec: same logic. Th→Ac, Lr→Rf, middle→same col in period 7
    if (el.atomicNumber === 90) {
      entry.up = 'Ac';
    } else if (el.atomicNumber === 103) {
      entry.up = 'Rf';
    } else {
      entry.up = getSymbolAt(7, col) ?? null;
    }
    // Down: no-op (bottom of grid)
    entry.down = null;
  } else if (row === 6 && col >= 4 && col <= 17) {
    // Period 6, groups 4-17: down goes to lanthanide row
    entry.up = findInDirection(row, col, -1, 0);
    entry.down = getSymbolAt(9, col) ?? null;
  } else if (row === 7 && col >= 4 && col <= 17) {
    // Period 7, groups 4-17: down goes to actinide row
    entry.up = findInDirection(row, col, -1, 0);
    entry.down = getSymbolAt(10, col) ?? null;
  } else {
    // Standard main grid
    entry.up = findInDirection(row, col, -1, 0);
    entry.down = findInDirection(row, col, 1, 0);
  }

  return entry;
}

export const adjacencyMap = new Map<string, AdjacencyEntry>();
for (const el of allElements) {
  adjacencyMap.set(el.symbol, computeAdjacency(el));
}
