import { describe, it, expect } from 'vitest';
import {
  contrastTextColor,
  getCellPosition,
  adjacencyMap,
  blockColor,
  VIEWBOX_W,
  VIEWBOX_H,
  CELL_WIDTH,
  CELL_HEIGHT,
} from '../src/lib/grid';
import { allElements, getElement } from '../src/lib/data';

describe('contrastTextColor', () => {
  it('returns paper (#f7f2e8) for dark fills', () => {
    expect(contrastTextColor('#133e7c')).toBe('#f7f2e8'); // deep blue
    expect(contrastTextColor('#9e1c2c')).toBe('#f7f2e8'); // warm red
    expect(contrastTextColor('#0f0f0f')).toBe('#f7f2e8'); // black
    expect(contrastTextColor('#000000')).toBe('#f7f2e8');
  });

  it('returns black (#0f0f0f) for light fills', () => {
    expect(contrastTextColor('#f7f2e8')).toBe('#0f0f0f'); // paper
    expect(contrastTextColor('#ffffff')).toBe('#0f0f0f');
    expect(contrastTextColor('#ece7db')).toBe('#0f0f0f'); // dim
    expect(contrastTextColor('#c59b1a')).toBe('#0f0f0f'); // mustard
  });
});

describe('blockColor', () => {
  it('returns correct color for each block', () => {
    expect(blockColor('s')).toBe('#133e7c');
    expect(blockColor('p')).toBe('#c59b1a');
    expect(blockColor('d')).toBe('#9e1c2c');
    expect(blockColor('f')).toBe('#0f0f0f');
  });
});

describe('getCellPosition', () => {
  it('returns unique positions for all 118 elements', () => {
    const positions = new Set<string>();
    for (const el of allElements) {
      const pos = getCellPosition(el);
      const key = `${pos.x},${pos.y}`;
      expect(positions.has(key)).toBe(false);
      positions.add(key);
    }
    expect(positions.size).toBe(118);
  });

  it('places H at row 1, col 1', () => {
    const h = getElement('H')!;
    const pos = getCellPosition(h);
    expect(pos.row).toBe(1);
    expect(pos.col).toBe(1);
  });

  it('places He at row 1, col 18', () => {
    const he = getElement('He')!;
    const pos = getCellPosition(he);
    expect(pos.row).toBe(1);
    expect(pos.col).toBe(18);
  });

  it('places lanthanides (Ce-Yb, Lu) in row 9', () => {
    const ce = getElement('Ce')!;
    const lu = getElement('Lu')!;
    expect(getCellPosition(ce).row).toBe(9);
    expect(getCellPosition(lu).row).toBe(9);
  });

  it('places actinides (Th-No, Lr) in row 10', () => {
    const th = getElement('Th')!;
    const lr = getElement('Lr')!;
    expect(getCellPosition(th).row).toBe(10);
    expect(getCellPosition(lr).row).toBe(10);
  });

  it('all positions within viewBox bounds', () => {
    for (const el of allElements) {
      const pos = getCellPosition(el);
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.x + CELL_WIDTH).toBeLessThanOrEqual(VIEWBOX_W);
      expect(pos.y + CELL_HEIGHT).toBeLessThanOrEqual(VIEWBOX_H);
    }
  });
});

describe('adjacencyMap', () => {
  it('has entries for all 118 elements', () => {
    expect(adjacencyMap.size).toBe(118);
  });

  it('up from Ce goes to La (main grid)', () => {
    const entry = adjacencyMap.get('Ce')!;
    expect(entry.up).toBe('La');
  });

  it('up from Lu goes to Hf', () => {
    const entry = adjacencyMap.get('Lu')!;
    expect(entry.up).toBe('Hf');
  });

  it('up from Th goes to Ac', () => {
    const entry = adjacencyMap.get('Th')!;
    expect(entry.up).toBe('Ac');
  });

  it('up from Lr goes to Rf', () => {
    const entry = adjacencyMap.get('Lr')!;
    expect(entry.up).toBe('Rf');
  });

  it('no-op at top edge: up from H is null', () => {
    const entry = adjacencyMap.get('H')!;
    expect(entry.up).toBe(null);
  });

  it('no-op at left edge: left from H is null', () => {
    const entry = adjacencyMap.get('H')!;
    expect(entry.left).toBe(null);
  });

  it('no-op at right edge: right from He is null', () => {
    const entry = adjacencyMap.get('He')!;
    expect(entry.right).toBe(null);
  });

  it('down from actinide row is null (bottom of grid)', () => {
    // Pick an actinide that has no element below it
    const entry = adjacencyMap.get('No')!; // No(102) is in actinide row
    expect(entry.down).toBe(null);
  });

  it('all arrow directions lead to valid cell or null (no-op)', () => {
    const validSymbols = new Set(allElements.map((e) => e.symbol));
    for (const [symbol, entry] of adjacencyMap) {
      expect(validSymbols.has(symbol)).toBe(true);
      for (const dir of ['up', 'down', 'left', 'right'] as const) {
        const target = entry[dir];
        if (target !== null) {
          expect(validSymbols.has(target)).toBe(true);
        }
      }
    }
  });
});
