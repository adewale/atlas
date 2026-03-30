import { describe, it, expect } from 'vitest';
import { allElements, getElement, searchElements } from '../src/lib/data';

describe('getElement', () => {
  it('returns element by symbol', () => {
    const fe = getElement('Fe');
    expect(fe).toBeDefined();
    expect(fe!.name).toBe('Iron');
    expect(fe!.atomicNumber).toBe(26);
  });

  it('returns undefined for invalid symbol', () => {
    expect(getElement('Xx')).toBeUndefined();
  });

  it('is case-sensitive', () => {
    expect(getElement('fe')).toBeUndefined();
    expect(getElement('FE')).toBeUndefined();
  });
});

describe('searchElements', () => {
  it('finds by exact symbol', () => {
    const results = searchElements('Fe');
    expect(results.some(r => r.symbol === 'Fe')).toBe(true);
  });

  it('finds by name', () => {
    const results = searchElements('Iron');
    expect(results.some(r => r.symbol === 'Fe')).toBe(true);
  });

  it('is case-insensitive', () => {
    const results = searchElements('iron');
    expect(results.some(r => r.symbol === 'Fe')).toBe(true);
  });

  it('returns empty for nonsense', () => {
    const results = searchElements('xyzzy123');
    expect(results).toHaveLength(0);
  });

  it('partial match on name', () => {
    const results = searchElements('Hyd');
    expect(results.some(r => r.symbol === 'H')).toBe(true);
  });
});

describe('allElements', () => {
  it('has 118 elements', () => {
    expect(allElements).toHaveLength(118);
  });

  it('elements are sorted by atomic number', () => {
    for (let i = 1; i < allElements.length; i++) {
      expect(allElements[i].atomicNumber).toBeGreaterThan(allElements[i - 1].atomicNumber);
    }
  });
});
