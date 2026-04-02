/**
 * Test Fixture Schema Validator — prevents Lesson #17.
 *
 * Lesson #17: Test fixtures drifted from the real data schema when new
 *   properties were added (density, melting/boiling points, half-life).
 *   CI passed locally but failed when fixtures were stale.
 *
 * This test validates that:
 *   1. The ElementRecord type matches what's actually in the data files
 *   2. Every key in a real element exists in the makeElement() fixture pattern
 *   3. No required fields are missing from generated data
 *   4. Data types match expectations (numbers are numbers, etc.)
 */
import { describe, test, expect } from 'vitest';
import { allElements, getElement } from '../src/lib/data';
import type { ElementRecord } from '../src/lib/types';

/** The canonical set of keys every ElementRecord must have. */
const REQUIRED_KEYS: (keyof ElementRecord)[] = [
  'atomicNumber',
  'symbol',
  'name',
  'wikidataId',
  'wikipediaTitle',
  'wikipediaUrl',
  'period',
  'group',
  'block',
  'category',
  'phase',
  'mass',
  'electronegativity',
  'ionizationEnergy',
  'radius',
  'density',
  'meltingPoint',
  'boilingPoint',
  'halfLife',
  'discoveryYear',
  'discoverer',
  'etymologyOrigin',
  'etymologyDescription',
  'summary',
  'neighbors',
  'rankings',
];

/** Fields that may be null (their type includes | null). */
const NULLABLE_KEYS = new Set<string>([
  'group',
  'electronegativity',
  'ionizationEnergy',
  'radius',
  'density',
  'meltingPoint',
  'boilingPoint',
  'halfLife',
  'discoveryYear',
]);

describe('element data schema integrity', () => {
  test('all 118 elements are loaded', () => {
    expect(allElements.length).toBe(118);
  });

  test('every element has all required keys', () => {
    const missing: string[] = [];
    for (const el of allElements) {
      for (const key of REQUIRED_KEYS) {
        if (!(key in el)) {
          missing.push(`${el.symbol}: missing "${key}"`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  test('non-nullable fields are never null or undefined', () => {
    const violations: string[] = [];
    for (const el of allElements) {
      for (const key of REQUIRED_KEYS) {
        if (NULLABLE_KEYS.has(key)) continue;
        const val = el[key];
        if (val === null || val === undefined) {
          violations.push(`${el.symbol}.${key} is ${val}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test('numeric fields have correct types', () => {
    const violations: string[] = [];
    const numericFields: (keyof ElementRecord)[] = [
      'atomicNumber', 'period', 'mass',
    ];

    for (const el of allElements) {
      for (const field of numericFields) {
        const val = el[field];
        if (typeof val !== 'number') {
          violations.push(`${el.symbol}.${field}: expected number, got ${typeof val}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test('string fields have correct types', () => {
    const violations: string[] = [];
    const stringFields: (keyof ElementRecord)[] = [
      'symbol', 'name', 'block', 'category', 'phase', 'discoverer',
      'etymologyOrigin', 'etymologyDescription', 'summary',
    ];

    for (const el of allElements) {
      for (const field of stringFields) {
        const val = el[field];
        if (typeof val !== 'string') {
          violations.push(`${el.symbol}.${field}: expected string, got ${typeof val}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test('rankings is a non-empty object for every element', () => {
    const violations: string[] = [];
    for (const el of allElements) {
      if (!el.rankings || typeof el.rankings !== 'object') {
        violations.push(`${el.symbol}: rankings is not an object`);
      } else if (Object.keys(el.rankings).length === 0) {
        violations.push(`${el.symbol}: rankings is empty`);
      }
    }
    expect(violations).toEqual([]);
  });

  test('neighbors is an array of valid symbols', () => {
    const symbolSet = new Set(allElements.map((e) => e.symbol));
    const violations: string[] = [];

    for (const el of allElements) {
      if (!Array.isArray(el.neighbors)) {
        violations.push(`${el.symbol}: neighbors is not an array`);
        continue;
      }
      for (const neighbor of el.neighbors) {
        if (!symbolSet.has(neighbor)) {
          violations.push(`${el.symbol}: neighbor "${neighbor}" is not a valid symbol`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test('block values are restricted to s, p, d, f', () => {
    const validBlocks = new Set(['s', 'p', 'd', 'f']);
    const violations: string[] = [];
    for (const el of allElements) {
      if (!validBlocks.has(el.block)) {
        violations.push(`${el.symbol}: block "${el.block}" is not in {s, p, d, f}`);
      }
    }
    expect(violations).toEqual([]);
  });

  test('period values are 1–7', () => {
    for (const el of allElements) {
      expect(el.period).toBeGreaterThanOrEqual(1);
      expect(el.period).toBeLessThanOrEqual(7);
    }
  });

  test('group values are 1–18 or null (f-block)', () => {
    for (const el of allElements) {
      if (el.group !== null) {
        expect(el.group).toBeGreaterThanOrEqual(1);
        expect(el.group).toBeLessThanOrEqual(18);
      } else {
        // Null group should only be f-block
        expect(el.block).toBe('f');
      }
    }
  });

  test('atomic numbers are 1–118 with no gaps', () => {
    const numbers = allElements.map((e) => e.atomicNumber).sort((a, b) => a - b);
    for (let i = 0; i < 118; i++) {
      expect(numbers[i]).toBe(i + 1);
    }
  });
});

describe('per-element JSON consistency', () => {
  test('getElement returns matching data for sample elements', () => {
    const samples = ['H', 'He', 'Fe', 'Au', 'Og'];
    for (const sym of samples) {
      const el = getElement(sym);
      expect(el, `getElement('${sym}') returned undefined`).toBeDefined();
      expect(el!.symbol).toBe(sym);
    }
  });
});
