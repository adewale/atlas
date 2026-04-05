import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import gridElements from '../data/generated/grid-elements.json';
import fullElements from '../data/generated/elements.json';

/**
 * These tests verify that grid-elements.json is a suitable replacement for
 * elements.json in the grid/PeriodicTable rendering path.
 *
 * The grid needs exactly these fields per element:
 *
 *   grid.ts (position + adjacency):  symbol, atomicNumber, group, period
 *   PeriodicTable.tsx (cell render):  symbol, atomicNumber, name, category, block
 *   PeriodicTable.tsx (heatmap):      mass, electronegativity, ionizationEnergy, radius
 *   PeriodicTable.tsx (highlight):    group, period
 *   PropertyScatter/TimelineEra etc:  discoveryYear, discoverer, etymologyOrigin
 *
 * Total unique fields needed: 13 (from the 20-field GridElement type)
 */

const GRID_REQUIRED_FIELDS = [
  'atomicNumber',
  'symbol',
  'name',
  'group',
  'period',
  'block',
  'category',
  'mass',
  'electronegativity',
  'ionizationEnergy',
  'radius',
  'discoveryYear',
  'discoverer',
  'etymologyOrigin',
] as const;

describe('grid-elements.json suitability for PeriodicTable', () => {
  it('contains exactly 118 elements', () => {
    expect(gridElements).toHaveLength(118);
  });

  it('every element has all fields required by grid.ts and PeriodicTable.tsx', () => {
    for (const el of gridElements as Record<string, unknown>[]) {
      for (const field of GRID_REQUIRED_FIELDS) {
        expect(el, `${el.symbol} missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('every element value matches the full elements.json source of truth', () => {
    const fullBySymbol = new Map(
      (fullElements as Record<string, unknown>[]).map((el) => [el.symbol, el]),
    );

    for (const gridEl of gridElements as Record<string, unknown>[]) {
      const fullEl = fullBySymbol.get(gridEl.symbol as string);
      expect(fullEl, `${gridEl.symbol} not found in full elements.json`).toBeDefined();

      for (const field of GRID_REQUIRED_FIELDS) {
        expect(gridEl[field], `${gridEl.symbol}.${field} mismatch`).toEqual(
          fullEl![field],
        );
      }
    }
  });

  it('is significantly smaller than full elements.json', () => {
    const gridSize = JSON.stringify(gridElements).length;
    const fullSize = JSON.stringify(fullElements).length;
    // grid-elements should be less than half the size of full elements
    expect(gridSize).toBeLessThan(fullSize * 0.5);
  });

  it('grid.ts computePosition fields: group can be null, period is always a number', () => {
    for (const el of gridElements as Record<string, unknown>[]) {
      expect(
        typeof el.group === 'number' || el.group === null,
        `${el.symbol}.group should be number|null`,
      ).toBe(true);
      expect(typeof el.period, `${el.symbol}.period should be number`).toBe('number');
    }
  });

  it('grid.ts computePosition fields: atomicNumber is always a positive integer', () => {
    for (const el of gridElements as Record<string, unknown>[]) {
      expect(typeof el.atomicNumber).toBe('number');
      expect(Number.isInteger(el.atomicNumber)).toBe(true);
      expect(el.atomicNumber as number).toBeGreaterThan(0);
    }
  });

  it('PeriodicTable block field is one of s, p, d, f', () => {
    const validBlocks = new Set(['s', 'p', 'd', 'f']);
    for (const el of gridElements as Record<string, unknown>[]) {
      expect(validBlocks.has(el.block as string), `${el.symbol}.block = "${el.block}"`).toBe(
        true,
      );
    }
  });

  it('symbols are unique', () => {
    const symbols = (gridElements as Record<string, unknown>[]).map((el) => el.symbol);
    expect(new Set(symbols).size).toBe(118);
  });

  it('grid-elements.json has fewer fields per element than elements.json', () => {
    const gridKeys = Object.keys((gridElements as Record<string, unknown>[])[0]);
    const fullKeys = Object.keys((fullElements as Record<string, unknown>[])[0]);
    expect(gridKeys.length).toBeLessThan(fullKeys.length);
  });

  it('does NOT carry heavy fields that the grid never reads', () => {
    const heavyFields = [
      'wikidataId',
      'wikipediaTitle',
      'wikipediaUrl',
      'etymologyDescription',
      'summary',
      'rankings',
      'sources',
    ];
    for (const el of gridElements as Record<string, unknown>[]) {
      for (const field of heavyFields) {
        expect(el, `${el.symbol} should NOT have "${field}"`).not.toHaveProperty(field);
      }
    }
  });
});

describe('grid.ts and data.ts import the slim grid-elements.json (not full elements.json)', () => {
  const gridSrc = readFileSync(resolve(__dirname, '../src/lib/grid.ts'), 'utf-8');
  const dataSrc = readFileSync(resolve(__dirname, '../src/lib/data.ts'), 'utf-8');

  it('grid.ts imports from grid-elements.json', () => {
    expect(gridSrc).toMatch(/grid-elements\.json/);
    expect(gridSrc).not.toMatch(/['"].*\/elements\.json['"]/);
  });

  it('data.ts does NOT eagerly import the full elements.json at module scope', () => {
    // The full elements.json should only be loaded on-demand by route loaders,
    // not synchronously at module scope in data.ts.
    expect(dataSrc).not.toMatch(
      /^import\s+\w+\s+from\s+['"].*\/elements\.json['"]/m,
    );
  });
});
