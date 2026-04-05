/**
 * Integration tests for search against real entity-index data.
 *
 * These tests use the actual generated data (not mocks) to verify
 * that search connects entities across types — e.g. searching for
 * a discoverer name also surfaces the elements they discovered.
 */
import { describe, it, expect } from 'vitest';
import { createLocalSearch } from '../src/lib/searchLocal';
import entities from '../data/generated/entity-index.json';
import elements from '../data/generated/elements.json';

type Entity = (typeof entities)[number];
type Element = (typeof elements)[number];

const search = createLocalSearch(entities as Entity[], elements as Element[]);

describe('Curie search', () => {
  const res = search({ q: 'Curie' });
  const ids = res.results.map((r) => r.id);
  const types = new Set(res.results.map((r) => r.type));

  it('returns both element and discoverer types', () => {
    expect(types).toContain('element');
    expect(types).toContain('discoverer');
  });

  it('finds the discoverer card', () => {
    expect(ids).toContain('discoverer-Marie Curie & Pierre Curie');
  });

  it('finds elements discovered by the Curies (Po, Ra)', () => {
    expect(ids).toContain('element-Po');
    expect(ids).toContain('element-Ra');
  });

  it('finds elements named after Curie (Cm)', () => {
    expect(ids).toContain('element-Cm');
  });

  it('ranks discoverer card highest', () => {
    expect(res.results[0].id).toBe('discoverer-Marie Curie & Pierre Curie');
  });
});

describe('Seaborg search', () => {
  const res = search({ q: 'Seaborg' });
  const ids = res.results.map((r) => r.id);

  it('finds the discoverer card', () => {
    const seaborg = res.results.find((r) => r.type === 'discoverer' && r.name.includes('Seaborg'));
    expect(seaborg).toBeDefined();
  });

  it('finds Seaborgium (named after Seaborg)', () => {
    expect(ids).toContain('element-Sg');
  });

  it('finds elements discovered by Seaborg', () => {
    // Seaborg co-discovered Pu, Am, Cm, Bk, Cf, Es, Fm, Md, No, Sg
    expect(ids).toContain('element-Pu');
  });
});

describe('symbol search', () => {
  it('exact symbol match ranks first', () => {
    const res = search({ q: 'Fe' });
    expect(res.results[0].id).toBe('element-Fe');
  });

  it('finds element by full name', () => {
    const res = search({ q: 'Oxygen' });
    expect(res.results[0].id).toBe('element-O');
  });
});

describe('entity types in results', () => {
  it('all results are element or discoverer', () => {
    const res = search({ q: '' });
    for (const r of res.results) {
      expect(['element', 'discoverer']).toContain(r.type);
    }
  });

  it('no anomaly, era, or etymology results', () => {
    const res = search({ q: '' });
    const types = new Set(res.results.map((r) => r.type));
    expect(types).not.toContain('anomaly');
    expect(types).not.toContain('era');
    expect(types).not.toContain('etymology');
  });
});
