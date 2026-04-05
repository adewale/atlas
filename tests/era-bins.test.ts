/**
 * Unit tests for shared/era-bins.ts — the single source of truth for eras.
 */
import { describe, it, expect } from 'vitest';
import { ERA_BINS, yearToEra, eraBySlug, yearInEra } from '../shared/era-bins';

describe('ERA_BINS', () => {
  it('has exactly 8 eras', () => {
    expect(ERA_BINS).toHaveLength(8);
  });

  it('every bin has slug, label, and year range', () => {
    for (const bin of ERA_BINS) {
      expect(bin.slug).toBeTruthy();
      expect(bin.label).toBeTruthy();
      // minYear is null only for ancient
      if (bin.slug === 'ancient') {
        expect(bin.minYear).toBeNull();
      } else {
        expect(bin.minYear).toBeGreaterThanOrEqual(1700);
      }
    }
  });

  it('bins are contiguous — no gaps between maxYear and next minYear', () => {
    for (let i = 1; i < ERA_BINS.length; i++) {
      const prev = ERA_BINS[i - 1];
      const curr = ERA_BINS[i];
      if (prev.maxYear != null && curr.minYear != null) {
        expect(curr.minYear).toBe(prev.maxYear + 1);
      }
    }
  });

  it('slugs are URL-safe (no spaces, no unicode)', () => {
    for (const bin of ERA_BINS) {
      expect(bin.slug).toMatch(/^[a-z0-9\-]+$/);
    }
  });
});

describe('yearToEra', () => {
  it('null → ancient', () => {
    expect(yearToEra(null).slug).toBe('ancient');
  });

  it('undefined → ancient', () => {
    expect(yearToEra(undefined).slug).toBe('ancient');
  });

  it('year < 1700 → ancient', () => {
    expect(yearToEra(1250).slug).toBe('ancient');
    expect(yearToEra(1669).slug).toBe('ancient');
    expect(yearToEra(0).slug).toBe('ancient');
  });

  it('1700–1799 → 1700s', () => {
    expect(yearToEra(1700).slug).toBe('1700s');
    expect(yearToEra(1766).slug).toBe('1700s');
    expect(yearToEra(1799).slug).toBe('1700s');
  });

  it('1800–1849 → 1800-1849', () => {
    expect(yearToEra(1800).slug).toBe('1800-1849');
    expect(yearToEra(1849).slug).toBe('1800-1849');
  });

  it('boundary: 1849 vs 1850', () => {
    expect(yearToEra(1849).slug).toBe('1800-1849');
    expect(yearToEra(1850).slug).toBe('1850-1899');
  });

  it('boundary: 1939 vs 1940', () => {
    expect(yearToEra(1939).slug).toBe('1900-1939');
    expect(yearToEra(1940).slug).toBe('1940-1955');
  });

  it('boundary: 1955 vs 1956', () => {
    expect(yearToEra(1955).slug).toBe('1940-1955');
    expect(yearToEra(1956).slug).toBe('1956-1999');
  });

  it('boundary: 1999 vs 2000', () => {
    expect(yearToEra(1999).slug).toBe('1956-1999');
    expect(yearToEra(2000).slug).toBe('2000s');
  });

  it('future years → 2000s', () => {
    expect(yearToEra(2024).slug).toBe('2000s');
    expect(yearToEra(3000).slug).toBe('2000s');
  });

  it('every element maps to a valid era', () => {
    const elements = require('../data/generated/elements.json');
    for (const el of elements) {
      const era = yearToEra(el.discoveryYear);
      expect(ERA_BINS).toContain(era);
    }
  });
});

describe('eraBySlug', () => {
  it('finds each era by slug', () => {
    for (const bin of ERA_BINS) {
      expect(eraBySlug(bin.slug)).toBe(bin);
    }
  });

  it('returns undefined for unknown slug', () => {
    expect(eraBySlug('1770s')).toBeUndefined();
    expect(eraBySlug('antiquity')).toBeUndefined();
    expect(eraBySlug('')).toBeUndefined();
  });
});

describe('yearInEra', () => {
  it('null year is in ancient', () => {
    expect(yearInEra(null, ERA_BINS[0])).toBe(true);
  });

  it('null year is not in 1700s', () => {
    expect(yearInEra(null, ERA_BINS[1])).toBe(false);
  });

  it('1766 is in 1700s', () => {
    const bin = eraBySlug('1700s')!;
    expect(yearInEra(1766, bin)).toBe(true);
  });

  it('1766 is not in 1800-1849', () => {
    const bin = eraBySlug('1800-1849')!;
    expect(yearInEra(1766, bin)).toBe(false);
  });

  it('boundary: 1849 in 1800-1849, not in 1850-1899', () => {
    expect(yearInEra(1849, eraBySlug('1800-1849')!)).toBe(true);
    expect(yearInEra(1849, eraBySlug('1850-1899')!)).toBe(false);
  });

  it('2024 is in 2000s', () => {
    expect(yearInEra(2024, eraBySlug('2000s')!)).toBe(true);
  });
});
