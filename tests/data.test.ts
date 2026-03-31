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
  function legacySearch(query: string) {
    if (!query.trim()) return allElements;
    const q = query.toLowerCase().trim();
    const matches = allElements.filter(
      (el) =>
        el.name.toLowerCase().includes(q) ||
        el.symbol.toLowerCase().includes(q),
    );
    return matches.sort((a, b) => {
      const aSymL = a.symbol.toLowerCase();
      const bSymL = b.symbol.toLowerCase();
      const aNameL = a.name.toLowerCase();
      const bNameL = b.name.toLowerCase();
      const aScore =
        aSymL === q ? 0 : aNameL === q ? 1 : aSymL.startsWith(q) ? 2 : aNameL.startsWith(q) ? 3 : 4;
      const bScore =
        bSymL === q ? 0 : bNameL === q ? 1 : bSymL.startsWith(q) ? 2 : bNameL.startsWith(q) ? 3 : 4;
      return aScore - bScore || a.atomicNumber - b.atomicNumber;
    });
  }

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

  it('exact symbol match is prioritized over partial name match', () => {
    // "hydrogen" contains "n", but Nitrogen (N) should come first for query "N"
    const nResults = searchElements('N');
    expect(nResults[0].symbol).toBe('N');

    // "hydrogen" contains "o", but Oxygen (O) should come first for query "O"
    const oResults = searchElements('O');
    expect(oResults[0].symbol).toBe('O');

    // "magnesium" contains "s", but Sulfur (S) should come first for query "S"
    const sResults = searchElements('S');
    expect(sResults[0].symbol).toBe('S');
  });

  it('exact name match is prioritized over partial name match', () => {
    // "Neon" contains "ne" but searching "Neon" should return Neon first
    const results = searchElements('Neon');
    expect(results[0].symbol).toBe('Ne');
  });

  it('matches the legacy ranking behavior exactly for representative queries', () => {
    const queries = new Set<string>([
      '',
      ' ',
      'Fe',
      'fE',
      'Iron',
      'hyd',
      'N',
      'O',
      'S',
      'x',
      'xyzzy123',
      ...allElements.map((el) => el.symbol),
      ...allElements.map((el) => el.name),
    ]);

    for (const query of queries) {
      const current = searchElements(query).map((el) => el.symbol);
      const legacy = legacySearch(query).map((el) => el.symbol);
      expect(current, `query: ${query}`).toEqual(legacy);
    }
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
