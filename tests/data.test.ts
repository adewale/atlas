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
  it('empty query returns all 118 elements', () => {
    expect(searchElements('')).toHaveLength(118);
    expect(searchElements('  ')).toHaveLength(118);
  });

  it('exact symbol match appears in results', () => {
    const results = searchElements('Fe');
    expect(results[0].symbol).toBe('Fe');
  });

  it('exact name match appears in results', () => {
    const results = searchElements('Iron');
    expect(results[0].name).toBe('Iron');
  });

  it('partial symbol "F" matches both F and Fe', () => {
    const results = searchElements('F');
    const symbols = results.map(r => r.symbol);
    expect(symbols).toContain('F');
    expect(symbols).toContain('Fe');
  });

  it('is case-insensitive', () => {
    const results = searchElements('iron');
    expect(results[0].symbol).toBe('Fe');
  });

  it('returns empty for nonsense', () => {
    const results = searchElements('xyzzy123');
    expect(results).toHaveLength(0);
  });

  it('partial match on name', () => {
    const results = searchElements('Hyd');
    expect(results[0].symbol).toBe('H');
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
